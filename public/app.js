const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap = s => s[0].toUpperCase() + s.slice(1);
const DV = {f:78, c:275, fi:28, p:50};

async function api(path, body, method) {
  const opt = (body || method) ? {method: method || 'POST', headers: {'Content-Type':'application/json'}, body: body ? JSON.stringify(body) : undefined} : undefined;
  const r = await fetch(path, opt);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
  return j;
}

/* tabs */
document.querySelectorAll('nav button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
function showTab(t) {
  document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  $('#tab-chat').hidden = t !== 'chat'; $('#tab-plan').hidden = t !== 'plan';
}

/* day bar */
function setDay(s) {
  $('#dtxt').textContent = `Today: ${Math.round(s.total.k)} / ${s.goal.k} kcal`;
  $('#dbar').style.width = Math.min(100, s.total.k / s.goal.k * 100) + '%';
}
const refreshDay = () => api('/api/log').then(setDay).catch(() => {});

/* chat rendering */
const chat = $('#chat');
function bubble(html, cls = '') {
  const d = document.createElement('div'); d.className = 'b ' + cls; d.innerHTML = html;
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d;
}
function labelHTML(r) {
  const t = r.total, one = r.items.length === 1, g = r.items.reduce((a, i) => a + i.g, 0);
  const row = (l, v, dv, s) => `<div class="r${s ? ' s' : ''}"><span>${s ? l : '<b>' + l + '</b>'} ${v} g</span><b>${dv ? Math.round(v / dv * 100) + '%' : ''}</b></div>`;
  const list = one ? '' : `<ul class="items">${r.items.map(i => `<li>${cap(esc(i.name))} – ${esc(i.desc)}</li>`).join('')}</ul>`;
  return list + `<div class="facts"><h2>${one ? cap(esc(r.items[0].name)) : 'Meal total'}</h2>
    <div class="sv">${one ? esc(r.items[0].desc) + ' (about ' + g + ' g)' : 'about ' + g + ' g in total'}</div>
    <div class="fat"></div><div class="cal"><b>Calories</b><span>${Math.round(t.k)}</span></div>
    ${row('Total fat', t.f, DV.f)}${row('Total carbohydrate', t.c, DV.c)}${row('Dietary fiber', t.fi, DV.fi, 1)}${row('Sugars', t.s, 0, 1)}${row('Protein', t.p, DV.p)}
    <small>% of a 2000 kcal day</small></div>`;
}
function addActions(el, acts) {
  const a = document.createElement('div'); a.className = 'acts';
  acts.forEach(([t, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => fn(b); a.appendChild(b); });
  el.appendChild(a);
}
function meter(l, v, g, u) {
  return `<div class="m"><div class="l"><span>${l}</span><span>${Math.round(v)} / ${g} ${u}</span></div><div class="bar"><i style="width:${Math.min(100, v / g * 100)}%"></i></div></div>`;
}
function render(r) {
  if (r.type === 'text') {
    const el = bubble(`<p>${esc(r.text)}</p>`);
    if (r.action === 'plan') addActions(el, [['Open diet planner', () => showTab('plan')]]);
  } else if (r.type === 'label') {
    const el = bubble(labelHTML(r));
    if (r.logged) { bubble('<p>Added to today.</p>'); refreshDay(); }
    else addActions(el, [['Add to today', async b => {
      b.disabled = true;
      try { setDay(await api('/api/log', {items: r.items.map(i => ({name: i.name, g: i.g, desc: i.desc}))})); b.textContent = 'Added'; }
      catch (e) { b.disabled = false; bubble(`<p>${esc(e.message)}</p>`); }
    }]]);
  } else if (r.type === 'compare') {
    const rows = [['Calories (kcal)','k'],['Protein (g)','p'],['Carbs (g)','c'],['Fat (g)','f'],['Fiber (g)','fi'],['Sugar (g)','s']];
    bubble(`<p>Per 100 g:</p><div class="wide"><table><tr><th></th>${r.foods.map(f => `<th>${cap(esc(f.n))}</th>`).join('')}</tr>
      ${rows.map(([l, k]) => `<tr><td>${l}</td>${r.foods.map(f => `<td>${f[k]}</td>`).join('')}</tr>`).join('')}</table></div>`);
  } else if (r.type === 'list') {
    bubble(`<p><b>${esc(r.title)}</b></p><ul class="top5">${r.rows.map(([n, v]) => `<li><span>${cap(esc(n))}</span><b>${v} ${esc(r.unit)}</b></li>`).join('')}</ul>`);
  } else if (r.type === 'summary') {
    setDay(r);
    if (!r.entries.length) return bubble('<p>Nothing logged yet. Say "I ate 2 eggs and a banana" to start.</p>');
    const t = r.total, g = r.goal;
    const el = bubble(`<p><b>Today so far</b></p><ul class="items">${r.entries.map(e => `<li>${cap(esc(e.name))} – ${esc(e.descr)} (${Math.round(e.k)} kcal)</li>`).join('')}</ul>
      ${meter('Calories', t.k, g.k, 'kcal')}${meter('Protein', t.p, g.p, 'g')}${meter('Carbs', t.c, g.c, 'g')}${meter('Fat', t.f, g.f, 'g')}`);
    addActions(el, [['Clear today', async () => { setDay(await api('/api/log', null, 'DELETE')); bubble('<p>Today\'s log is cleared.</p>'); }]]);
  }
}
async function send(text) {
  bubble(esc(text), 'me');
  try { render(await api('/api/chat', {message: text})); }
  catch (e) { bubble(`<p>${esc(e.message)}</p>`); }
}
$('#cf').onsubmit = e => { e.preventDefault(); const v = $('#cq').value.trim(); if (v) { $('#cq').value = ''; send(v); } };
['Calories in a banana', '2 eggs and 1 roti', 'Compare rice vs roti', 'High protein foods', 'What have I eaten today?'].forEach(t => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => send(t); $('#chips').appendChild(b);
});
bubble('<p>Hi! Ask about any food or meal, or open the Diet plan tab for a personalised 7-day plan.</p>');

/* diet plan */
function planHTML(p) {
  const goal = {lose:'weight loss', maintain:'maintenance', gain:'weight gain'}[p.goal];
  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  return `<div class="stats">${stat(p.target + ' kcal', 'Daily target (' + goal + ')')}${stat(p.macros.p + ' g', 'Protein')}${stat(p.macros.c + ' g', 'Carbs')}${stat(p.macros.f + ' g', 'Fat')}${stat(p.bmi, 'BMI')}${stat(p.tdee + ' kcal', 'Maintenance')}</div>
  <div class="notes">${p.notes.map(n => `<p>${esc(n)}</p>`).join('')}</div>
  ${p.days.map((d, i) => `<details${i === 0 ? ' open' : ''}><summary><span>${d.day}</span><span>${Math.round(d.total.k)} kcal · ${Math.round(d.total.p)} g protein</span></summary>
    ${d.meals.map(m => `<div class="meal"><h4><span>${cap(m.slot)}</span><span>${m.k} kcal</span></h4><ul>${m.items.map(i => `<li>${cap(esc(i.name))} – ${i.g} g</li>`).join('')}</ul></div>`).join('')}</details>`).join('')}
  <p class="acts"><button type="button" onclick="window.print()" class="primary">Print or save as PDF</button></p>`;
}
$('#pf').onsubmit = async e => {
  e.preventDefault(); $('#perr').textContent = '';
  const body = Object.fromEntries(new FormData(e.target));
  try { $('#plan').innerHTML = planHTML(await api('/api/dietplan', body)); }
  catch (err) { $('#perr').textContent = err.message; }
};
api('/api/dietplan/latest').then(r => {
  if (!r.plan) return;
  for (const [k, v] of Object.entries(r.profile)) { const f = $('#pf').elements[k]; if (f) f.value = v; }
  $('#plan').innerHTML = planHTML(r.plan);
}).catch(() => {});
refreshDay();
