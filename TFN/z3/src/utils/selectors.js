// src/utils/selectors.js
import { buildItem } from "./format.js";

export function getBaseItems(state){
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
  if (q) base = base.filter(p => p.name.includes(q) || String(p.id) === q);
  return base;
}

export function getFilteredList(state){
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