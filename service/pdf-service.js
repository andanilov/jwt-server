const db = require('../db');
const fs = require('fs')
const StringDecoder = require('string_decoder').StringDecoder;
// const bcrypt = require('bcrypt');
// const uuid = require('uuid');
// const sql = require('yesql').pg
// const generatePassword = require('password-generator');
// const emailService = require('./mail-service');
// const tokenService = require('./token-service');
// const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
// const getPeriodByString = require('../utils/getPeriodByString');
// next function call next middleware in chain

class PdfService {
  async addTableFile(tpl, fileBuffer) {
    try {
      // 0. Config
      const separator = ';';
      const maxColLen = 128;
      const maxDataLen = 256;
      const colNameStopList = ['tpl', 'updated'];

      // 1. Chek if no buffer
      if (!Buffer.isBuffer(fileBuffer)) {
        throw ApiError.BadRequest(`Недостаточно данных!`);
      }

      // 2. Get file from buffer to strings array
      const fileStrArr = new TextDecoder('windows-1251')
        .decode(new Uint8Array(fileBuffer))
        .split('\r\n');

      // 3. Get table header
      const theadArr = fileStrArr.shift().split(separator);
      if (!theadArr.includes('code')) {
        throw ApiError.BadRequest(`Таблица не содержит обязательную колонку code!`);
      }
      if (new Set([...colNameStopList, ...theadArr]).size < [...colNameStopList, ...theadArr].length) {
        throw ApiError.BadRequest(`Таблица содержит зарезервированные системой поля: ${colNameStopList.join(', ')}`);
      }

      // 4. Set table struct (col - colNumber)
      const tableMap = theadArr.reduce((map, col, i) =>
        (!col.trim() || col.trim().length > maxColLen)
          ? map
          : { ...map, [col.trim()]: i}
      , {});
      const codePos = tableMap.code;
      // delete tableMap.code;

      if (!Object.keys(tableMap).length) {
        throw ApiError.BadRequest(`Недостаточно данных в таблице!`);
      }

      // 5. Add columns if not exist
      Object.keys(tableMap).length && await db.query(Object.keys(tableMap).map((col) =>
        `ALTER TABLE pdfdata ADD COLUMN IF NOT EXISTS ${col} VARCHAR(${maxDataLen})`)
        .join('; '));

      // 6. Add params to DB
      let rows = 0;
      fileStrArr.forEach(async (data) => {
        const dataArr = data.split(separator);

        // Check if no code
        if (!dataArr[codePos] || dataArr[codePos].trim() === '') {
          return;
        }

        dataArr[codePos] = dataArr[codePos].replace(/ /g, '');
        const dataStrByMap = Object.values(tableMap).reduce((table, col) => [...table, dataArr[col]], []);

        await db.query(`INSERT INTO pdfdata 
          (tpl, updated, ${Object.keys(tableMap).join(', ')})
          VALUES ($1, current_timestamp, ${dataArr.map((_, key) => '$' + (key + 2))})
          ON CONFLICT (code) DO UPDATE SET
          updated=current_timestamp ${Object.keys(tableMap).map((col, key) => col === 'code' ? '' : ` ${col}=$${key + 2}`)} ;`,
          [tpl, ...dataStrByMap]);

        rows += 1;
      });
      
      return rows;
    } catch (e) {
      throw ApiError.BadRequest(`Не удалось обновить данные по файлу-таблице: ${e.message}`);
    }
  }

  async getProductByCode(code) {
    const product = await db.query(`SELECT * FROM pdfdata WHERE code=$1`, [code]);
    return product.rows[0];
  }
}

module.exports = new PdfService();
