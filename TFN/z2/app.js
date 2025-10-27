const API = "https://pokeapi.co/api/v2";

const appState = {
  list: [],
  details: null,
  types: [],
  query: "",
  activeTypes: new Set(),
  mode: "jsx",
  loading: false,
  error: "",
  cache: {},
  _detailsPrefetched: false,
  index: [],
  typeIndex: {}
};

// Capitalize
function cap(s){
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

// Delay
function delay(ms){
  return new Promise(r => setTimeout(r, ms));
}

function buildItem(id, name){
  return {
    id,
    name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
  };
}

function idFromUrl(url){
  const parts = url.split("/");
  return parts[parts.length - 2];
}

function update(mutator){
  mutator(appState);
  render();
}

// FETCH / LOGIC
async function loadInitial(){
  try{
    update(s => { s.loading = true; s.error = ""; });

    const res = await fetch(`${API}/pokemon?limit=50`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const list = data.results.map(p => {
      const id = p.url.split("/").at(-2);
      return {
        id,
        name: p.name,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
      };
    });
    update(s => { s.list = list; });

    const rt = await fetch(`${API}/type`);
    if(!rt.ok) throw new Error("HTTP " + rt.status);
    const td = await rt.json();
    update(s => { s.types = td.results.map(t => t.name).sort(); });
  }catch(e){
    console.error(e);
    update(s => { s.error = "Failed to load initial data. Try reload."; });
  }finally{
    update(s => { s.loading = false; });
  }
}

// Full index (names + ids) for global search
async function loadIndex(){
  try{
    const res = await fetch(`${API}/pokemon?limit=20000`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const index = data.results.map(p => {
      const id = p.url.split("/").at(-2);
      return { id, name: p.name };
    });
    update(s => { s.index = index; });
  }catch(e){
    console.error(e);
  }
}

// Ensure we have type->ids for all requested types
async function ensureTypeIndexFor(types){
  const toFetch = types.filter(t => !appState.typeIndex[t]);
  if (toFetch.length === 0) return;

  for (const t of toFetch){
    try{
      const res = await fetch(`${API}/type/${t}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const ids = new Set(data.pokemon.map(x => idFromUrl(x.pokemon.url)));
      update(s => { s.typeIndex[t] = ids; });
    }catch(e){
      console.error("ensureTypeIndexFor failed for type:", t, e);
    }
  }
}

async function openDetails(idOrName){
  update(s => { s.loading = true; s.error = ""; });
  try{
    const res = await fetch(`${API}/pokemon/${idOrName}`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();

    await delay(500);

    update(s => {
      s.details = d;
      s.cache[d.id] = d;
      s.cache[d.name] = d;
    });
  }catch(e){
    console.error(e);
    update(s => { s.error = "Failed to load details."; });
  }finally{
    update(s => { s.loading = false; });
  }
}

// Prefetch for the initial 50
async function ensureAllDetails(){
  if(appState._detailsPrefetched) return;
  appState._detailsPrefetched = true;
  update(s => { s.loading = true; });
  try{
    for(const p of appState.list){
      if(appState.cache[p.id]) continue;
      const res = await fetch(`${API}/pokemon/${p.id}`);
      if(!res.ok) throw new Error("HTTP " + res.status);
      const d = await res.json();
      update(s => { s.cache[d.id] = d; });
    }
  }catch(e){
    console.error(e);
    update(s => { s.error = "Prefetch failed (types filter may be incomplete)."; });
  }finally{
    update(s => { s.loading = false; });
  }
}

function toggleType(t){
  update(s => {
    if(s.activeTypes.has(t)) s.activeTypes.delete(t);
    else s.activeTypes.add(t);
  });

  if (appState.activeTypes.size > 0){
    if (!appState.index.length) loadIndex();
    ensureTypeIndexFor([...appState.activeTypes]);
    prefetchVisibleDetails();
  }
}

// Base items for the current query (no type filters applied)
function getBaseItems(state){
  const q = state.query.trim().toLowerCase();

  if (q && state.index && state.index.length){
    const fromIndex = state.index.filter(p => p.name.includes(q) || String(p.id) === q);
    return fromIndex.map(p => buildItem(p.id, p.name));
  }

  if (!q && state.activeTypes.size > 0){
    const types = [...state.activeTypes];
    const allReady = types.every(t => state.typeIndex[t]);
    if (allReady && state.index.length){
      let intersection = null;
      for (const t of types){
        const setT = state.typeIndex[t];
        if (intersection === null) intersection = new Set(setT);
        else {
          for (const id of Array.from(intersection)){
            if (!setT.has(id)) intersection.delete(id);
          }
        }
      }
      const nameById = new Map(state.index.map(p => [p.id, p.name]));
      const items = Array.from(intersection)
        .map(id => {
          const name = nameById.get(id);
          return name ? buildItem(id, name) : null;
        })
        .filter(Boolean);
      return items;
    }
  }

  let base = state.list;
  if (q){
    base = base.filter(p => p.name.includes(q) || String(p.id) === q);
  }
  return base;
}

async function prefetchVisibleDetails(limit = 80, concurrency = 6){
  const baseItems = getBaseItems(appState).slice(0, limit);
  const missing = baseItems.filter(p => !appState.cache[p.id]);

  const queue = [...missing];
  async function worker(){
    while (queue.length){
      const p = queue.shift();
      try{
        const res = await fetch(`${API}/pokemon/${p.id}`);
        if (!res.ok) continue;
        const d = await res.json();
        update(s => { s.cache[d.id] = d; });
      }catch(_){}
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, missing.length) }, worker)
  );
}

// Input handler: live search
function onQueryInput(e){
  const val = e.target.value;
  update(s => { s.query = val; });

  if (appState.activeTypes.size > 0){
    prefetchVisibleDetails();
  }
}

function getFilteredList(state){
  const q = state.query.trim();

  let items = getBaseItems(state);

  if (q && state.activeTypes.size){
    const required = [...state.activeTypes];
    items = items.filter(p => {
      const d = state.cache[p.id];
      if(!d) return false;
      const its = d.types.map(t => t.type.name);
      return required.every(t => its.includes(t));
    });
  }


  return items.slice(0, 100);
}

// COMPONENTS
function PokemonCardJSX({ p, onOpen }){
  return (
    <li className="row" onClick={() => onOpen(p.id)}>
      <span className="badge">#{String(p.id).padStart(3,"0")}</span>
      <img className="sprite" src={p.sprite} alt={p.name}/>
      <div className="name">{cap(p.name)}</div>
    </li>
  );
}

function PokemonCardCE({ p, onOpen }){
  return React.createElement(
    "li", { className:"row", onClick: () => onOpen(p.id) },
    React.createElement("span", { className:"badge" }, `#${String(p.id).padStart(3,"0")}`),
    React.createElement("img", { className:"sprite", src:p.sprite, alt:p.name }),
    React.createElement("div", { className:"name" }, cap(p.name))
  );
}

function PokemonCard(props){
  return appState.mode === "jsx" ? PokemonCardJSX(props) : PokemonCardCE(props);
}

function StatBar({ label, value }){
  const pct = Math.min(100, Math.round((value/200)*100));
  const level = value >= 120 ? "high" : value >= 70 ? "mid" : "low"; 
  const color = level === "high" ? "#ef4444" : level === "mid" ? "#f59e0b" : "#22c55e";
  return (
    <div style={{display:"grid",gridTemplateColumns:"80px 1fr 36px",gap:8,alignItems:"center"}}>
      <div>{label.toUpperCase()}</div>
      <div style={{height:8,background:"#e4ecff",border:"1px solid #b0c3f1",borderRadius:8,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color}} />
      </div>
      <div>{value}</div>
    </div>
  );
}

function Details({ d }){
  if(!d) return <div className="muted">Pick something from the list or search…</div>;

  const img = d.sprites?.other?.["official-artwork"]?.front_default || d.sprites?.front_default || "";
  const types = d.types.map(t => t.type.name);
  const statsObj = Object.fromEntries(d.stats.map(s => [s.stat.name, s.base_stat]));
  const statKeys = ["hp","attack","defense","special-attack","special-defense","speed"];
  const sumStats = d.stats.reduce((a,s)=>a+s.base_stat,0);

  return (
    <div className="details">
      <div style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:10,alignItems:"center"}}>
        <img
          src={img}
          alt={d.name}
          style={{width:130,height:130,objectFit:"contain",border:"1px solid #b0c3f1",borderRadius:8,background:"#fff"}}
        />
        <div>
          <h3 style={{margin:"0 0 6px"}}>#{d.id} — {cap(d.name)}</h3>
          <div style={{marginBottom:8}}>
            {types.map(t => <span key={t} className="typeTag">{cap(t)}</span>)}
          </div>
          <div className="kv">
            <div>Height</div><div>{(d.height/10).toFixed(1)} m</div>
            <div>Weight</div><div>{(d.weight/10).toFixed(1)} kg</div>
            <div>Total</div><div>{sumStats}</div>
          </div>
          <div className="abilities">
            {d.abilities.map(a => (
              <span key={a.ability.name} className={`ability ${a.is_hidden ? "hidden" : ""}`}>
                {cap(a.ability.name)}{a.is_hidden ? " (hidden)" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:10,display:"grid",gap:6}}>
        {statKeys.map(k => <StatBar key={k} label={k} value={statsObj[k] || 0} />)}
      </div>
    </div>
  );
}

function App({ state }){
  const items = getFilteredList(state);
  return (
    <div className="wrap">
      <header className="wrap" style={{paddingLeft:0,paddingRight:0}}>
        <h1>GameDex v2</h1>

        <div className="searchRow">
          <input
            placeholder="Search by name or number…"
            value={state.query}
            onInput={onQueryInput}
          />
          <button className="btn" onClick={() => update(s => { s.query = ""; })}>Clear</button>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <label><input type="radio" name="mode" checked={state.mode==="jsx"} onChange={()=>update(s=>{s.mode="jsx";})}/> JSX</label>
            <label><input type="radio" name="mode" checked={state.mode==="ce"} onChange={()=>update(s=>{s.mode="ce";})}/> createElement</label>
          </div>
        </div>

        <div className="status">
          {state.loading && <span className="spin" aria-hidden="true"></span>}
          {state.error
            ? <span className="error" style={{padding:"4px 8px"}}>{state.error}</span>
            : <span>{items.length} results</span>
          }
        </div>

        {/* Type filters */}
        <div style={{marginTop:10, display:"flex", flexWrap:"wrap", gap:8}}>
          {state.types.map(t => (
            <label key={t} style={{background:"#fff",border:"1px solid #b0c3f1",borderRadius:10,padding:"6px 8px",fontSize:12}}>
              <input
                type="checkbox"
                checked={state.activeTypes.has(t)}
                onChange={() => toggleType(t)}
                style={{marginRight:6}}
              />
              {cap(t)}
            </label>
          ))}
        </div>
      </header>

      <main className="grid">
        <section>
          <h2 className="muted">List</h2>
          <ul className="list">
            {items.map(p => <PokemonCard key={p.id} p={p} onOpen={openDetails} />)}
          </ul>
        </section>

        <section>
          <h2 className="muted">Details</h2>
          <Details d={state.details} />
        </section>
      </main>
    </div>
  );
}

//RENDER (manual, no hooks)
const root = ReactDOM.createRoot(document.getElementById("root"));
function render(){ root.render(<App state={appState} />); }

// Start
render();
loadInitial();
loadIndex();