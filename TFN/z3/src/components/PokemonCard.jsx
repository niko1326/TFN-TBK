// src/components/PokemonCard.jsx
import React from "react";
import { cap } from "../utils/format.js";

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

export default function PokemonCard(props){
  return props.mode === "jsx" ? <PokemonCardJSX {...props} /> : PokemonCardCE(props);
}