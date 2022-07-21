const jwt = require('jsonwebtoken');
const db = require('../db');

class TokenService {
  // --- Genereate Access and refresh tokens
  generationTokens(payload) {
    return {
      accessToken: jwt.sign(payload, process.env.JWT_ACCESS_KEY, { 
        expiresIn: process.env.JWT_ACCESS_ALIVE_TIME
      }),
      refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
        expiresIn: process.env.JWT_REFRESH_KEY
      })
    };
  }

  // --- Save refresh token
  async saveToken(email, refreshToken) {
    // 1. Check if email refresh token exists and get id
    const emailTokenId = await db.query(`SELECT id FROM token WHERE email=$1`, [email]);

    // 2. Add or update refresh token
    try {
      emailTokenId.rows.length && emailTokenId.rows[0].id
        ? await db.query(`UPDATE token SET token=$2 WHERE id=$1`, [emailTokenId.rows[0].id, refreshToken])
        : await db.query(`INSERT INTO token (email, token) VALUES ($1, $2)`, [email, refreshToken]);
    } catch (e) {
      throw e;
    }
  }

  // --- Remove refresh token
  async removeToken(refreshToken) {
    // 1. Delete refresh token from DB
    const deletedToken = await db.query(`DELETE FROM token WHERE token=$1`, [refreshToken]);
    
    return deletedToken;
  }

  // --- Validate Access token
  async validateAccessToken(token) {
    // 1. Check if token is right by jwt.verify()
    try {
      const tokenPayload = await jwt.verify(token, process.env.JWT_ACCESS_KEY);
      return tokenPayload;
    } catch (e) {
      return false;
    }
  }

  // --- Validate Refresh Token
  async validateRefreshToken(token) {
    // 1. Check if refresh token is right
    try {
      const tokenPayload = await jwt.verify(token, process.env.JWT_REFRESH_KEY);
      return tokenPayload;
    } catch (e) {
      return false;
    }
  }

  // --- Find token in DB by token
  async findToken(refreshToken) {
    // 1. Find token in DB
    const tokenInDB = await db.query(`SELECT * FROM token WHERE token=$1`, [refreshToken]);
    return tokenInDB.rows[0];
  }

}

module.exports = new TokenService();
