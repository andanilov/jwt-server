const Model = require('express').Router;
const model = new Model();

/* Models */
const tables = [
  require('../models/user-model'),
  require('../models/token-model'),
  require('../models/pdf-model'),
];

/* Create DB struct */
model.get('/', (req, res, next) => {
  tables.forEach((table) => table.createModel());
  res.json('Model was created!');
});

module.exports = model;
