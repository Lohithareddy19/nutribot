const { MEALS } = require('../data/foods');
const { BY, nut, totals } = require('./nutrition');

const ACT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
const SLOTS = [['breakfast', 0.25], ['lunch', 0.35], ['snack', 0.15], ['dinner', 0.25]];

function buildPlan(d) {
  const age = parseInt(d.age, 10), h = parseFloat(d.height), w = parseFloat(d.weight);
  if ([age, h, w].some(Number.isNaN)) throw new Error('Enter age, height (cm) and weight (kg) as numbers.');
  if (age < 14 || age > 90 || h < 120 || h > 220 || w < 30 || w > 250)
    throw new Error('Please enter realistic values: age 14-90, height 120-220 cm, weight 30-250 kg.');
  const sex = d.sex === 'male' ? 'male' : 'female';
  const act = d.activity in ACT ? d.activity : 'light';
  let goal = ['lose', 'maintain', 'gain'].includes(d.goal) ? d.goal : 'maintain';
  const diet = d.diet in MEALS ? d.diet : 'veg';
  const bmi = Math.round(w / ((h / 100) ** 2) * 10) / 10;
  const notes = [];
  if (goal === 'lose' && (age < 18 || bmi < 18.5)) {
    goal = 'maintain';
    notes.push("A weight-loss plan isn't suitable for your age or BMI, so this plan keeps your weight steady. Please talk to a doctor or dietitian.");
  }
  const bmr = 10 * w + 6.25 * h - 5 * age + (sex === 'male' ? 5 : -161);
  const tdee = bmr * ACT[act];
  const target = Math.max(tdee + { lose: -450, maintain: 0, gain: 400 }[goal], sex === 'male' ? 1500 : 1200);
  const prot = Math.round(w * { lose: 1.6, maintain: 1.2, gain: 1.8 }[goal]);
  const fat = Math.round(target * 0.25 / 9);
  const carb = Math.round((target - prot * 4 - fat * 9) / 4);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const meals = [], dayItems = [];
    for (const [slot, share] of SLOTS) {
      const opts = MEALS[diet][slot];
      const tpl = opts[(i + (slot === 'snack' ? 1 : 0)) % opts.length];
      const base = tpl.reduce((a, [n, g]) => a + BY[n].k * g / 100, 0);
      const scale = Math.min(2, Math.max(0.6, target * share / base));
      const items = tpl.map(([n, g]) => {
        const grams = Math.max(5, Math.round(g * scale / 5) * 5);
        return { name: n, g: grams, ...nut(BY[n], grams) };
      });
      dayItems.push(...items);
      meals.push({ slot, items, k: Math.round(items.reduce((a, x) => a + x.k, 0)) });
    }
    days.push({ day: 'Day ' + (i + 1), meals, total: totals(dayItems, ['k', 'p', 'c', 'f', 'fi']) });
  }
  notes.push('Drink 2-3 litres of water a day. Swap meals within the same slot to add variety.');
  notes.push('Estimates use the Mifflin-St Jeor equation. This is general guidance, not medical advice.');
  return { bmi, bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target), goal, diet,
           macros: { p: prot, c: carb, f: fat }, notes, days };
}

module.exports = { buildPlan };
