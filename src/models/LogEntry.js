const mongoose = require('mongoose');
module.exports = mongoose.model('LogEntry', new mongoose.Schema({
  day: { type: String, index: true },   // YYYY-MM-DD (server local date)
  name: String, descr: String,
  k: Number, p: Number, c: Number, f: Number,
}, { timestamps: true }));
