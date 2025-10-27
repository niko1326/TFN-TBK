// src/state/store.js
export const initialState = {
    API: "https://pokeapi.co/api/v2",
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
  
  let state = structuredClone(initialState);
  const listeners = new Set();
  
  export function getState(){ return state; }
  
  export function setState(mutator){
    const draft = structuredClone(state);
    mutator(draft);
    draft.activeTypes = new Set(draft.activeTypes);
    state = draft;
    listeners.forEach(l => l(state));
  }
  
  export function subscribe(fn){
    listeners.add(fn);
    return () => listeners.delete(fn);
  }