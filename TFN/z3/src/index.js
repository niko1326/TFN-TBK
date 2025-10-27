// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.css";

import { getState, setState, subscribe } from "./state/store.js";
import { getBaseItems } from "./utils/selectors.js";
import {
  loadInitial, loadIndex, ensureTypeIndexFor,
  openDetails, ensureAllDetails, prefetchVisibleDetails
} from "./services/api.js";

const root = createRoot(document.getElementById("root"));

const actions = {
  setQuery(val){
    setState(s => { s.query = val; });
    if (getState().activeTypes.size > 0){
      const items = getBaseItems(getState()).slice(0, 80);
      prefetchVisibleDetails(items);
    }
  },
  setMode(m){ setState(s => { s.mode = m; }); },
  toggleType(t){
    setState(s => {
      if(s.activeTypes.has(t)) s.activeTypes.delete(t);
      else s.activeTypes.add(t);
    });
    const st = getState();
    if (st.activeTypes.size > 0){
      if (!st.index.length) loadIndex();
      ensureTypeIndexFor([...st.activeTypes]);
      const items = getBaseItems(getState()).slice(0, 80);
      prefetchVisibleDetails(items);
    }
  },
  openDetails
};

function render(){ root.render(<App state={getState()} actions={actions} />); }
subscribe(render);
render();

loadInitial();
loadIndex();
// opcjonalny prefetch „legacy”
ensureAllDetails();