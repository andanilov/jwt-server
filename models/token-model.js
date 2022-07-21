const db = require('../db');

class TokenModel {
  async createModel () { console.log('Hi');
    try {
      await db.query(`
          CREATE TABLE IF NOT EXISTS token (
            id SERIAL PRIMARY KEY,
            email VARCHAR(128) NOT NULL,
            token TEXT
          );`);
    } catch(e) {
      console.log(e.message);
    }
  }
}

module.exports = TokenModel;
