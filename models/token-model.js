const db = require('../db');

class TokenModel {
  async createModel () { 
    try {
      await db.query(`
          CREATE TABLE IF NOT EXISTS token (
            id SERIAL PRIMARY KEY,
            email VARCHAR(128) NOT NULL,
            token TEXT
          );`);
      console.log('Таблица token создана!');
    } catch(e) {
      console.log(e.message);
    }
  }
}

module.exports = new TokenModel();
