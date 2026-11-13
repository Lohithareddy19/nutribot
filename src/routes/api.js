const express = require('express');
const LogEntry = require('../models/LogEntry');
const Plan = require('../models/Plan');
const { BY, nut, totals } = require('../services/nutrition');
const { handleChat } = require('../services/chat');
const { buildPlan } = require('../services/dietPlan');

const router = express.Router();
const GOAL = { k: 2000, p: 50, c: 275, f: 78 };
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

async function saveItems(items) {
  const day = today();
  await LogEntry.insertMany(items.map(it => {
    const n = nut(BY[it.name], it.g);
    return { day, name: it.name, descr: it.desc || it.g + ' g', k: n.k, p: n.p, c: n.c, f: n.f };
  }));
}
async function dayState() {
  const rows = await LogEntry.find({ day: today() }).sort({ _id: 1 }).lean();
  const entries = rows.map(r => ({ name: r.name, descr: r.descr, k: r.k, p: r.p, c: r.c, f: r.f }));
  return { entries, total: totals(entries, ['k', 'p', 'c', 'f']), goal: GOAL };
}

router.post('/chat', wrap(async (req, res) => {
  const { reply, log } = handleChat(req.body && req.body.message);
  if (log.length) await saveItems(log);
  res.json(reply.type === 'summary' ? { ...reply, ...(await dayState()) } : reply);
}));

router.get('/log', wrap(async (req, res) => res.json(await dayState())));

router.post('/log', wrap(async (req, res) => {
  const raw = Array.isArray(req.body && req.body.items) ? req.body.items.slice(0, 20) : [];
  const items = raw
    .filter(it => it && BY[it.name] && Number(it.g) > 0 && Number(it.g) <= 5000)
    .map(it => ({ name: it.name, g: Number(it.g), desc: String(it.desc || '').slice(0, 40) }));
  if (!items.length) return res.status(400).json({ error: 'No valid foods to add.' });
  await saveItems(items);
  res.json(await dayState());
}));

router.delete('/log', wrap(async (req, res) => {
  await LogEntry.deleteMany({ day: today() });
  res.json(await dayState());
}));

router.post('/dietplan', wrap(async (req, res) => {
  let plan;
  try { plan = buildPlan(req.body || {}); }
  catch (e) { return res.status(400).json({ error: e.message }); }
  await Plan.create({ profile: req.body, plan });
  res.json(plan);
}));

router.get('/dietplan/latest', wrap(async (req, res) => {
  const r = await Plan.findOne().sort({ _id: -1 }).lean();
  res.json(r ? { plan: r.plan, profile: r.profile } : { plan: null });
}));

module.exports = router;
