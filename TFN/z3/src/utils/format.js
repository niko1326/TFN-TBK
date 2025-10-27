// src/utils/format.js
export function cap(s){ return s ? s[0].toUpperCase() + s.slice(1) : ""; }
export const delay = (ms) => new Promise(r => setTimeout(r, ms));

export function buildItem(id, name){
  return {
    id,
    name,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
  };
}

export function idFromUrl(url){
  const parts = url.split("/");
  return parts[parts.length - 2];
}