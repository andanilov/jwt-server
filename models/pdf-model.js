const db = require('../db');

class UserModel {
  async createModel () {
    try {
      await db.query(`CREATE TABLE IF NOT EXISTS pdfdata (
        code VARCHAR(32) primary key,
        tpl VARCHAR(64) NOT NULL,
        updated TIMESTAMP
      );`);      
      console.log('Таблица pdfdata создана!');
    } catch(e) {
        console.log(e.message);
    }
  } 
}

module.exports = new UserModel();
