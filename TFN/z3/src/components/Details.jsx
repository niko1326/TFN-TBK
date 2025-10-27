// src/components/Details.jsx
import React from "react";
import StatBar from "./StatBar.jsx";
import { cap } from "../utils/format.js";

export default function Details({ d }){
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