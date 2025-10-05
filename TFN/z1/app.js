const API = 'https://pokeapi.co/api/v2/pokemon';
const listEl = document.getElementById('list');
const detailsEl = document.getElementById('details');
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');

let baseList = [];   // { id, name, sprite } pierwsze 20
let filtered = [];   // do wyświetlania po filtrze

// ---------- Utils ----------
function setLoading(on, text = 'Ładowanie…') {
  statusEl.textContent = on ? text : '';
}
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}
function pokemonIdFromUrl(url) {
  // url np. https://pokeapi.co/api/v2/pokemon/25/
  const m = url.match(/\/pokemon\/(\d+)\/*$/);
  return m ? Number(m[1]) : null;
}
function cap(s='') { return s.charAt(0).toUpperCase() + s.slice(1); }

// ---------- API ----------
async function getPokemonList(limit = 20) {
  const url = `${API}?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Błąd pobierania listy (${res.status})`);
  const data = await res.json();
  // Każdy element ma name + url -> potrzebujemy też sprite: pobierzmy „lightweight” z /pokemon/{id}
  const minimal = await Promise.all(
    data.results.map(async (p) => {
      const id = pokemonIdFromUrl(p.url);
      // Spróbujmy złożyć URL sprite bez dodatkowego requestu (oficjalne sprite’y GitHub)
      const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      return { id, name: p.name, sprite };
    })
  );
  return minimal;
}

async function getPokemonDetails(idOrName) {
  const res = await fetch(`${API}/${idOrName}`);
  if (!res.ok) throw new Error(`Nie znaleziono Pokémona: ${idOrName}`);
  return await res.json();
}

// ---------- Render ----------
function renderList(items) {
  listEl.innerHTML = '';
  items.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <img src="${p.sprite}" alt="${p.name}" loading="lazy"/>
      <div>
        <h3>#${p.id} — ${cap(p.name)}</h3>
        <div class="small">Kliknij, aby zobaczyć szczegóły</div>
      </div>
    `;
    li.addEventListener('click', () => loadDetails(p.id));
    listEl.appendChild(li);
  });
}

function renderDetails(data) {
  const types = data.types.map(t => cap(t.type.name));
  const statsMap = Object.fromEntries(data.stats.map(s => [s.stat.name, s.base_stat]));
  const keys = ['hp','attack','defense','speed'];
  const heightM = (data.height / 10).toFixed(1);
  const weightKg = (data.weight / 10).toFixed(1);
  const img = data.sprites?.other?.['official-artwork']?.front_default
           || data.sprites?.front_default
           || '';

  detailsEl.classList.remove('placeholder');
  detailsEl.innerHTML = `
    <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;align-items:center;">
      <img src="${img}" alt="${data.name}" style="width:140px;height:140px;object-fit:contain;background:#0f1331;border-radius:12px;border:1px solid #2a2f5a"/>
      <div>
        <h3 style="margin:0 0 4px;">#${data.id} — ${cap(data.name)}</h3>
        <div class="badges">
          ${types.map(t => `<span class="badge">${t}</span>`).join('')}
        </div>
        <div class="kv">
          <div>Wzrost:</div><div>${heightM} m</div>
          <div>Waga:</div><div>${weightKg} kg</div>
        </div>
      </div>
    </div>

    <div class="stats">
      ${keys.map(k => {
        const val = statsMap[k] ?? 0;
        const pct = Math.min(100, Math.round((val / 200) * 100)); // prosta skala
        return `
          <div class="stat">
            <div>${k.toUpperCase()}</div>
            <div class="bar"><div style="width:${pct}%"></div></div>
            <div>${val}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ---------- Actions ----------
async function loadBaseList() {
  try {
    showError('');
    setLoading(true, 'Ładowanie listy Pokémonów…');
    baseList = await getPokemonList(20);
    filtered = baseList.slice();
    renderList(filtered);
  } catch (e) {
    showError(e.message || 'Wystąpił nieoczekiwany błąd podczas pobierania listy.');
  } finally {
    setLoading(false);
  }
}

async function loadDetails(idOrName) {
  try {
    showError('');
    setLoading(true, 'Pobieranie szczegółów…');
    const data = await getPokemonDetails(idOrName);
    renderDetails(data);
  } catch (e) {
    showError(e.message || 'Nie udało się pobrać szczegółów.');
  } finally {
    setLoading(false);
  }
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    filtered = baseList.slice();
  } else {
    filtered = baseList.filter(p => p.name.includes(q));
  }
  renderList(filtered);
}

// ---------- Events ----------
searchBtn.addEventListener('click', async () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return applyFilter(); // pusty -> pokaż całą 20
  // Spróbuj pobrać dokładnie wpisanego Pokémona
  await loadDetails(q);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  applyFilter();
  detailsEl.classList.add('placeholder');
  detailsEl.textContent = 'Wybierz Pokémona z listy albo użyj wyszukiwarki.';
});

searchInput.addEventListener('input', applyFilter);
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// Start
loadBaseList();
