const { FOODS, findFood, parseItem, totals } = require('./nutrition');

const HELP = 'I\'m NutriBot. Ask about a food or meal ("2 eggs and 1 roti", "150 g paneer"), compare foods ' +
  '("rice vs roti"), ask for rankings ("high protein foods"), or say "I ate a banana" to log it. ' +
  'For a personalised plan, use the Diet plan tab.';

const LISTS = [
  [/high.?protein|protein.?rich|most protein/, 'p', 'Highest in protein (per 100 g)', 'g', false],
  [/low.?cal|fewest cal|lightest|least cal/, 'k', 'Lowest in calories (per 100 g)', 'kcal', true],
  [/high.?cal|most cal/, 'k', 'Highest in calories (per 100 g)', 'kcal', false],
  [/fib(er|re)/, 'fi', 'Highest in fiber (per 100 g)', 'g', false],
  [/low.?carb/, 'c', 'Lowest in carbs (per 100 g)', 'g', true],
  [/low.?fat/, 'f', 'Lowest in fat (per 100 g)', 'g', true],
  [/high.?carb|most carb/, 'c', 'Highest in carbs (per 100 g)', 'g', false],
  [/(high|most|lots of) sugar/, 's', 'Highest in sugar (per 100 g)', 'g', false],
];

// Returns { reply, log }: reply is the JSON for the client, log is a list of items to save.
function handleChat(message) {
  const q = String(message || '').slice(0, 200).toLowerCase().replace(/[^a-z0-9.,& ]/g, ' ').replace(/\s+/g, ' ').trim();
  const text = t => ({ reply: { type: 'text', text: t }, log: [] });
  if (!q) return text('Type a food or a question.');
  if (/^(hi|hello|hey|help)\b/.test(q)) return text(HELP);
  const foodInQ = findFood(q);
  if (/\b(diet plan|meal plan|plan)\b/.test(q) && !foodInQ)
    return { reply: { type: 'text', action: 'plan', text: 'I can build a 7-day plan from your age, weight, goal and food preference.' }, log: [] };
  if ((/\b(today|summary|so far)\b/.test(q) && !foodInQ) || (q.includes('eaten') && !foodInQ))
    return { reply: { type: 'summary' }, log: [] };
  if (/\bvs\b|versus|compare/.test(q)) {
    const parts = q.replace(/^compare /, '').split(/\bvs\b|versus|\band\b|\bor\b|\bwith\b|,/);
    const fs = [...new Map(parts.map(p => findFood(p.trim())).filter(Boolean).map(f => [f.n, f])).values()];
    if (fs.length < 2) return text('Tell me two foods to compare, like "rice vs roti".');
    return { reply: { type: 'compare', foods: fs }, log: [] };
  }
  for (const [re, key, title, unit, asc] of LISTS) {
    if (re.test(q)) {
      const top = [...FOODS].sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key])).slice(0, 6);
      return { reply: { type: 'list', title, unit, rows: top.map(f => [f.n, f[key]]) }, log: [] };
    }
  }
  const items = q.split(/\band\b|,|&|\bplus\b|\bwith\b/).map(parseItem).filter(Boolean);
  if (!items.length) {
    const w = q.split(' ').filter(x => x.length > 2);
    const near = FOODS.filter(f => w.some(x => f.n.startsWith(x.slice(0, 3)))).map(f => f.n).slice(0, 4);
    return text("I couldn't find that in my food list." + (near.length ? ' Did you mean ' + near.join(', ') + '?' : ' Try rice, egg, banana, dal or paneer.'));
  }
  const logged = /\b(ate|had|eaten|eat|add|log|drank|consumed)\b/.test(q);
  return { reply: { type: 'label', items, total: totals(items.map(i => i.n)), logged }, log: logged ? items : [] };
}

module.exports = { handleChat };
