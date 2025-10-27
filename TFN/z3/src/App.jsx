// src/App.jsx
import React from "react";
import PokemonCard from "./components/PokemonCard.jsx";
import Details from "./components/Details.jsx";
import { getFilteredList } from "./utils/selectors.js";

export default function App({ state, actions }){
  const items = getFilteredList(state);
  return (
    <div className="wrap">
      <header className="wrap" style={{paddingLeft:0,paddingRight:0}}>
        <h1>GameDex v2</h1>

        <div className="searchRow">
          <input
            placeholder="Search by name or number…"
            value={state.query}
            onInput={e => actions.setQuery(e.target.value)}
          />
          <button className="btn" onClick={() => actions.setQuery("")}>Clear</button>

          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <label><input type="radio" name="mode" checked={state.mode==="jsx"} onChange={()=>actions.setMode("jsx")}/> JSX</label>
            <label><input type="radio" name="mode" checked={state.mode==="ce"} onChange={()=>actions.setMode("ce")}/> createElement</label>
          </div>
        </div>

        <div className="status">
          {state.loading && <span className="spin" aria-hidden="true"></span>}
          {state.error
            ? <span className="error" style={{padding:"4px 8px"}}>{state.error}</span>
            : <span>{items.length} results</span>
          }
        </div>

        <div style={{marginTop:10, display:"flex", flexWrap:"wrap", gap:8}}>
          {state.types.map(t => (
            <label key={t} style={{background:"#fff",border:"1px solid #b0c3f1",borderRadius:10,padding:"6px 8px",fontSize:12}}>
              <input
                type="checkbox"
                checked={state.activeTypes.has(t)}
                onChange={() => actions.toggleType(t)}
                style={{marginRight:6}}
              />
              {t[0].toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </header>

      <main className="grid">
        <section>
          <h2 className="muted">List</h2>
          <ul className="list">
            {items.map(p => <PokemonCard key={p.id} p={p} onOpen={actions.openDetails} mode={state.mode} />)}
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