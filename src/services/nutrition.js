const { FOODS } = require('../data/foods');
const BY = Object.fromEntries(FOODS.map(f => [f.n, f]));
const NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5 };
const KEYS = ['k', 'p', 'c', 'f', 'fi', 's'];
const r1 = x => Math.round(x * 10) / 10;
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function nut(food, grams) {
  const o = {};
  for (const k of KEYS) o[k] = r1(food[k] * grams / 100);
  return o;
}

function findFood(t) {
  let best = null, bl = 0;
  for (const f of FOODS) {
    for (const nm of [f.n, ...f.al]) {
      if (nm.length > bl && new RegExp('\\b' + reEsc(nm) + '(?:s|es)?\\b').test(t)) { best = f; bl = nm.length; }
    }
  }
  return best;
}

function parseItem(seg) {
  const f = findFood(seg);
  if (!f) return null;
  const m = seg.match(/\b(\d+(?:\.\d+)?|half|one|two|three|four|five|six)\s*(kg|gms?|grams?|g|oz|ml)?\b/);
  let grams = f.g, desc = f.u;
  if (m) {
    const n = m[1] in NUM ? NUM[m[1]] : parseFloat(m[1]);
    const unit = m[2];
    if (unit) {
      grams = unit === 'kg' ? n * 1000 : unit === 'oz' ? n * 28.35 : n;
      desc = Math.round(grams) + ' g';
    } else {
      grams = n * f.g;
      desc = (n === 1 ? '' : n + ' x ') + f.u;
    }
  }
  grams = Math.max(1, Math.min(grams, 5000));
  return { name: f.n, desc, g: Math.round(grams), n: nut(f, grams) };
}

function totals(rows, keys = KEYS) {
  const t = {};
  for (const k of keys) t[k] = r1(rows.reduce((a, r) => a + (r[k] || 0), 0));
  return t;
}

module.exports = { FOODS, BY, nut, findFood, parseItem, totals };
