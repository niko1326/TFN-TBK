const API = "https://pokeapi.co/api/v2";

const appState = {
  list: [],               // [{id, name, sprite}]
  details: null,          // full pokemon object
  types: [],              // ["fire","water",...]
  query: "",              // live search (name or number)
  activeTypes: new Set(), // selected type filters
  mode: "jsx",            // "jsx" | "ce" (card renderer)
  loading: false,
  error: "",
  cache: {},              // id -> full details
  _detailsPrefetched: false
};

function cap(s){ return s ? s[0].toUpperCase() + s.slice(1) : ""; }
function delay(ms){ return new Promise(r => setTimeout(r, ms)); }

function update(mutator){
  mutator(appState);
  render();
}

// ====== FETCH / LOGIC (pure JS, async/await) ======
async function loadInitial(){
  try{
    update(s => { s.loading = true; s.error = ""; });

    // 1) first 50
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

    // 2) types
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

async function openDetails(idOrName){
  update(s => { s.loading = true; s.error = ""; });
  try{
    const res = await fetch(`${API}/pokemon/${idOrName}`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();

    // tiny delay so spinner is visible in class demo
    await delay(500);

    update(s => {
      s.details = d;
      s.cache[d.id] = d;
      s.cache[d.name] = d; // optional convenience
    });
  }catch(e){
    console.error(e);
    update(s => { s.error = "Failed to load details."; });
  }finally{
    update(s => { s.loading = false; });
  }
}

// Prefetch details for all visible list items (used when a type filter is turned on)
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
  // On first enabled filter, prefetch details so type filtering works on full list
  if(appState.activeTypes.size === 1) {
    // fire-and-forget; UI still responds because we call update inside loop
    ensureAllDetails();
  }
}

function getFilteredList(state){
  let items = state.list;

  // live search: by name includes OR exact id
  const q = state.query.trim().toLowerCase();
  if(q){
    items = items.filter(p => p.name.includes(q) || String(p.id) === q);
  }

  // type filters: all selected types must be present
  if(state.activeTypes.size){
    const required = [...state.activeTypes];
    items = items.filter(p => {
      const d = state.cache[p.id];
      if(!d) return false; // not prefetched yet
      const its = d.types.map(t => t.type.name);
      return required.every(t => its.includes(t));
    });
  }

  return items;
}

// ====== PRESENTATIONAL COMPONENTS (pure functions) ======
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
  const color = level === "high" ? "#22c55e" : level === "mid" ? "#f59e0b" : "#ef4444";
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
        <h1>GameDex v2 <span className="muted">(React, no hooks, JSX vs createElement)</span></h1>

        <div className="searchRow">
          <input
            placeholder="Search by name or number…"
            value={state.query}
            onInput={e => update(s => { s.query = e.target.value; })}
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
          <h2 className="muted">List (first 50)</h2>
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

// ====== RENDER (manual, no hooks) ======
const root = ReactDOM.createRoot(document.getElementById("root"));
function render(){ root.render(<App state={appState} />); }

// Start
render();
loadInitial();