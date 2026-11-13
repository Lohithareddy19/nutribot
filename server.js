require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const api = require('./src/routes/api');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use('/api', api);
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {            // central error handler
  console.error(err);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutribot';
  const port = process.env.PORT || 5000;
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (e) {
    console.error('Could not connect to MongoDB at ' + uri + '\nStart MongoDB or set MONGODB_URI in .env.');
    process.exit(1);
  }
  app.listen(port, () => console.log('NutriBot running at http://localhost:' + port));
}

if (require.main === module) start();
module.exports = app;
