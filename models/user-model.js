const db = require('../db');

class UserModel {
  async createModel () {
    try {
      await db.query(`CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(128) primary key,
        password VARCHAR(64) NOT NULL,
        name VARCHAR(64),
        isActivated BOOLEAN DEFAULT false,
        activationLink VARCHAR(255)
      );`);      
      console.log('Таблица users создана!');
    } catch(e) {
        console.log(e.message);
    }
  } 
}

module.exports = new UserModel();