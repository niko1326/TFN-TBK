// src/services/api.js
import { getState, setState } from "../state/store.js";
import { delay, idFromUrl } from "../utils/format.js";

export async function loadInitial(){
  const { API } = getState();
  try{
    setState(s => { s.loading = true; s.error = ""; });

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
    setState(s => { s.list = list; });

    const rt = await fetch(`${API}/type`);
    if(!rt.ok) throw new Error("HTTP " + rt.status);
    const td = await rt.json();
    setState(s => { s.types = td.results.map(t => t.name).sort(); });
  }catch(e){
    console.error(e);
    setState(s => { s.error = "Failed to load initial data. Try reload."; });
  }finally{
    setState(s => { s.loading = false; });
  }
}

export async function loadIndex(){
  const { API } = getState();
  try{
    const res = await fetch(`${API}/pokemon?limit=20000`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const index = data.results.map(p => {
      const id = p.url.split("/").at(-2);
      return { id, name: p.name };
    });
    setState(s => { s.index = index; });
  }catch(e){
    console.error(e);
  }
}

export async function ensureTypeIndexFor(types){
  const st = getState();
  const { API } = st;
  const toFetch = types.filter(t => !st.typeIndex[t]);
  if (toFetch.length === 0) return;

  for (const t of toFetch){
    try{
      const res = await fetch(`${API}/type/${t}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const ids = new Set(data.pokemon.map(x => idFromUrl(x.pokemon.url)));
      setState(s => { s.typeIndex[t] = ids; });
    }catch(e){
      console.error("ensureTypeIndexFor failed for type:", t, e);
    }
  }
}

export async function openDetails(idOrName){
  const { API } = getState();
  setState(s => { s.loading = true; s.error = ""; });
  try{
    const res = await fetch(`${API}/pokemon/${idOrName}`);
    if(!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();
    await delay(500);
    setState(s => {
      s.details = d;
      s.cache[d.id] = d;
      s.cache[d.name] = d;
    });
  }catch(e){
    console.error(e);
    setState(s => { s.error = "Failed to load details."; });
  }finally{
    setState(s => { s.loading = false; });
  }
}

export async function ensureAllDetails(){
  const st = getState();
  if(st._detailsPrefetched) return;
  setState(s => { s._detailsPrefetched = true; s.loading = true; });
  try{
    for(const p of st.list){
      if(getState().cache[p.id]) continue;
      const res = await fetch(`${st.API}/pokemon/${p.id}`);
      if(!res.ok) throw new Error("HTTP " + res.status);
      const d = await res.json();
      setState(s => { s.cache[d.id] = d; });
    }
  }catch(e){
    console.error(e);
    setState(s => { s.error = "Prefetch failed (types filter may be incomplete)."; });
  }finally{
    setState(s => { s.loading = false; });
  }
}

export async function prefetchVisibleDetails(items, concurrency = 6){
  const st = getState();
  const missing = items.filter(p => !st.cache[p.id]);
  const queue = [...missing];
  async function worker(){
    while (queue.length){
      const p = queue.shift();
      try{
        const res = await fetch(`${st.API}/pokemon/${p.id}`);
        if (!res.ok) continue;
        const d = await res.json();
        setState(s => { s.cache[d.id] = d; });
      }catch(_){}
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, missing.length) }, worker)
  );
}