// src/state/store.js
export const initialState = {
    API: "https://pokeapi.co/api/v2",
    list: [],               // [{id, name, sprite}]
    details: null,          // full pokemon object
    types: [],              // ["fire","water",...]
    query: "",              // live search (name or number)
    activeTypes: new Set(), // selected type filters
    mode: "jsx",            // "jsx" | "ce" (card renderer)
    loading: false,
    error: "",
    cache: {},              // id -> full details
    _detailsPrefetched: false,
    index: [],              // full index of all pokemon {id, name}
    typeIndex: {}           // { [typeName]: Set<string id> }
  };
  
  let state = structuredClone(initialState);
  const listeners = new Set();
  
  export function getState(){ return state; }
  
  export function setState(mutator){
    const draft = structuredClone(state);
    mutator(draft);
    // Zamiana Setów na Sety (structuredClone je zachowa, ale dla pewności)
    draft.activeTypes = new Set(draft.activeTypes);
    state = draft;
    listeners.forEach(l => l(state));
  }
  
  export function subscribe(fn){
    listeners.add(fn);
    return () => listeners.delete(fn);
  }