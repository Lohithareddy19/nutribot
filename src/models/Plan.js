const mongoose = require('mongoose');
module.exports = mongoose.model('Plan', new mongoose.Schema({
  profile: Object, plan: Object,
}, { timestamps: true }));
