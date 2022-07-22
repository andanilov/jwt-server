const Model = require('express').Router;
const model = new Model();

/* Models */
// const UserModel = require('../models/user-model');
// const TokenModel = require('../models/token-model');
const tables = [
  require('../models/user-model'),
  require('../models/token-model'),
];


model.get('/', (req, res, next) => {
  tables.forEach((table) => table.createModel());
  res.json('Model was created!'); 
});

module.exports = model;
