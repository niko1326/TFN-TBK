const API = 'https://pokeapi.co/api/v2/pokemon';

const elList = document.getElementById('list');
const elDetails = document.getElementById('details');
const elErr = document.getElementById('err');
const elStatus = document.getElementById('status');
const elStatusText = document.getElementById('statusText');
const q = document.getElementById('q');
const btnSearch = document.getElementById('btnSearch');
const btnClear = document.getElementById('btnClear');
const suggest = document.getElementById('suggest');

let baseList = [];
let names = [];
let cached = {};

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

function getIdFromUrl(url) {
  let parts = url.split('/');
  return parts[parts.length - 2];
}

function setLoading(on) {
  if (on) {
    elStatus.classList.add('loading');
    elStatusText.textContent = 'Ładowanie…';
  } else {
    elStatus.classList.remove('loading');
    elStatusText.textContent = '';
  }
}

function showErr(msg) {
  if (!msg) {
    elErr.hidden = true;
    elErr.textContent = '';
  } else {
    elErr.hidden = false;
    elErr.textContent = msg;
  }
}

async function getList() {
  let response = await fetch(API + '?limit=20');
  let data = await response.json();
  let results = [];
  for (let i = 0; i < data.results.length; i++) {
    let p = data.results[i];
    let id = getIdFromUrl(p.url);
    results.push({
      id: id,
      name: p.name,
      sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + id + '.png'
    });
  }
  return results;
}

async function getDetails(idOrName) {
  if (cached[idOrName]) {
    return cached[idOrName];
  }
  let response = await fetch(API + '/' + idOrName);
  let data = await response.json();
  cached[idOrName] = data;
  cached[data.id] = data;
  return data;
}

async function getAllNames() {
  let response = await fetch(API + '?limit=2000');
  let data = await response.json();
  let namesList = [];
  for (let i = 0; i < data.results.length; i++) {
    namesList.push(data.results[i].name);
  }
  return namesList.sort();
}

function renderList(items) {
  elList.innerHTML = '';
  for (let i = 0; i < items.length; i++) {
    let p = items[i];
    let li = document.createElement('li');
    li.className = 'row';
    let badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = '#' + String(p.id).padStart(3, '0');
    let img = document.createElement('img');
    img.className = 'sprite';
    img.src = p.sprite;
    img.alt = p.name;
    let nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = capitalize(p.name);
    li.appendChild(badge);
    li.appendChild(img);
    li.appendChild(nameDiv);
    li.addEventListener('click', function() {
      openDetails(p.id);
    });
    elList.appendChild(li);
  }
}

function renderDetails(d) {
  const types = d.types.map(t => capitalize(t.type.name));
  const stats = d.stats.reduce((acc, s) => {
    acc[s.stat.name] = s.base_stat;
    return acc;
  }, {});
  const img =
    d.sprites?.other?.['official-artwork']?.front_default ||
    d.sprites?.front_default ||
    '';
  const statKeys = ['hp', 'attack', 'defense', 'speed'];
  const statRows = statKeys.map(k => {
    const v = stats[k] || 0;
    const pct = Math.min(100, Math.round((v / 200) * 100));
    return `
      <div style="display:grid;grid-template-columns:80px 1fr 36px;gap:8px;align-items:center;">
        <div>${k.toUpperCase()}</div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div>${v}</div>
      </div>
    `;
  }).join('');
  elDetails.innerHTML = `
    <div style="display:grid;grid-template-columns:130px 1fr;gap:10px;align-items:center;">
      <img src="${img}" alt="${d.name}" style="width:130px;height:130px;object-fit:contain;border:1px solid #b0c3f1;border-radius:8px;background:#fff">
      <div>
        <h3 style="margin:0 0 4px">#${d.id} — ${capitalize(d.name)}</h3>
        <div>${types.map(t => `<span class="badge-type">${t}</span>`).join('')}</div>
        <div class="kv">
          <div>Wzrost</div><div>${(d.height / 10).toFixed(1)} m</div>
          <div>Waga</div><div>${(d.weight / 10).toFixed(1)} kg</div>
        </div>
      </div>
    </div>
    <div style="margin-top:8px; display:grid; gap:6px;">
      ${statRows}
    </div>
  `;
}

function ensureDetailsVisible() {
  const r = elDetails.getBoundingClientRect();
  const fullyVisible = r.top >= 0 && r.bottom <= window.innerHeight;
  if (!fullyVisible) {
    elDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function openDetails(idOrName) {
  try {
    showErr('');
    setLoading(true);
    let d = await getDetails(idOrName);
    renderDetails(d);
    let found = false;
    for (let i = 0; i < baseList.length; i++) {
      if (baseList[i].id == d.id) {
        found = true;
        break;
      }
    }
    if (!found) {
      let sprite = d.sprites.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + d.id + '.png';
      baseList.unshift({
        id: d.id,
        name: d.name,
        sprite: sprite
      });
      renderList(baseList);
    }
    elStatusText.textContent = 'Znaleziono: #' + d.id + ' ' + capitalize(d.name);
    ensureDetailsVisible();
  } catch (e) {
    showErr('Nie udało się pobrać szczegółów.');
    elStatusText.textContent = '';
  }
  setLoading(false);
}

function hideSuggest() {
  suggest.hidden = true;
  suggest.innerHTML = '';
  elStatusText.textContent = '';
}

function showSuggest(items) {
  suggest.innerHTML = '';
  const max = Math.min(10, items.length);
  for (let i = 0; i < max; i++) {
    const li = document.createElement('li');
    li.textContent = items[i];
    li.addEventListener('mousedown', function(e) {
      e.preventDefault();
      q.value = items[i];
      hideSuggest();
      btnSearch.click();
    });
    suggest.appendChild(li);
  }
  suggest.hidden = max === 0 ? true : false;
}

let typingTimeout;
function onType() {
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(function() {
    const text = q.value.trim().toLowerCase();
    if (!text) { hideSuggest(); return; }

    const results = [];
    for (let i = 0; i < names.length; i++) {
      if (names[i].includes(text)) results.push(names[i]);
    }

    if (results.length === 0) {
      hideSuggest();
      elStatusText.textContent = 'Brak wyników w nazwach.';
    } else {
      elStatusText.textContent = '';
      showSuggest(results);
    }
  }, 180);
}

btnSearch.addEventListener('click', function() {
  const text = q.value.trim().toLowerCase();
  if (!text) {
    renderList(baseList);
    elStatusText.textContent = '';
    return;
  }
  hideSuggest();
  openDetails(text);
});

btnClear.addEventListener('click', function() {
  q.value = '';
  hideSuggest();
  renderList(baseList);
  elDetails.textContent = 'Wybierz coś z listy albo wpisz nazwę.';
  showErr('');
  elStatusText.textContent = '';
});

q.addEventListener('input', onType);
q.addEventListener('blur', function() { setTimeout(hideSuggest, 100); });

q.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    hideSuggest();
    const text = q.value.trim().toLowerCase();
    if (!text) { renderList(baseList); elStatusText.textContent = ''; return; }
    openDetails(text);
  }
});

async function init() {
  try {
    setLoading(true);
    showErr('');
    baseList = await getList();
    renderList(baseList);
  } catch (e) {
    showErr('Nie udało się pobrać listy. Spróbuj odświeżyć.');
  }
  setLoading(false);
  try {
    setLoading(true);
    names = await getAllNames();
  } catch (e) {
    names = [];
  }
  setLoading(false);
}

init();