const db = require('../db');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const emailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
// next function call next middleware in chain

class UserService {
  // --- REGISTRATION
  async registration(email, password, name) {
    // 1. If the email exists
    const userExist = await db.query(`SELECT email FROM users WHERE email=$1`, [email]);
    if (userExist.rows.length) {
      throw ApiError.BadRequest(`Пользователь с email ${email} уже существует!`);
    }

    // 2. Get hash for password
    const hashPass = await bcrypt.hash(password, 3);

    // 3. Get random string for actiovation
    const activationStr = uuid.v4();

    // 4. Add user to DB
    const user = await (async function() {
      try {
        const newUser = await db.query(`INSERT INTO users VALUES ($1, $2, $3, $4, $5) RETURNING *`, [
          email, hashPass, name, false, activationStr
        ]);
        return newUser;
      } catch (e) {
        throw ApiError.BadRequest(`Не удалось добавить пользлователя ${email} : ${e.message}`);
      }      
    }());

    // 5. Send activation link to user by email
    await emailService.sendActiovationMail(email, `${process.env.API_URL}/api/user/activate/${activationStr}`);

    // 3. Generate tokens and get user info
    const tokensAndUser = await this._generateAndSaveTokens(email);
    return tokensAndUser;   
  }

  // --- LOGIN
  async activate(activationLink) {
    // 1. Search for user by actiovation link
    const user = await db.query(`SELECT email FROM users WHERE activationlink=$1`, [activationLink]);
    if (!user.rows.length || !user.rows[0]?.email ) {
      throw ApiError.BadRequest('Некорректная ссылка активации!');
    }

    // 2. Update user col isActivated
    await db.query(`UPDATE users SET isactivated=true WHERE email=$1`, [user.rows[0].email]);
  }

  async login(email, password) {
    // 1. Check if user exists
    const user = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    if (!user.rows.length) {
      throw ApiError.BadRequest(`Данный пользователь не найден или неверные реквизиты!`);
    }

    // 2. Check the password
    const isPassright = await bcrypt.compare(password, user.rows[0].password);
    if (!isPassright) {
      throw ApiError.BadRequest(`Данный пользователь не найден или неверные реквизиты!`);
    }
    
    // 3. Generate tokens and get user info
    const tokensAndUser = await this._generateAndSaveTokens(email);
    return tokensAndUser;   
  }

  // --- LOGOUT
  async logout(refreshToken) {
    // 1. Delete refresh token
    const token = await tokenService.removeToken(refreshToken);
    
    return token;
  }

  // --- REFRESH TOKEN
  async refresh(oldRefreshToken) {
    // 1. Check if refreshToken exists and set unauthorized error
    const refreshTokenDB = await db.query(`SELECT * FROM token WHERE token=$1`, [oldRefreshToken]);
    if (!refreshTokenDB.rows.length) {
      throw ApiError.UnauthorizedError();
    }
    
    // 2. Validate refresh token by token service or unauthorizedError
    const userData = await tokenService.validateRefreshToken(oldRefreshToken);
    if (!userData) {
      throw ApiError.UnauthorizedError();
    }

    // 3. Check if token is in DB by token service or unauthorizedError
    const tokenFromDB = await tokenService.findToken(oldRefreshToken);
    if (!tokenFromDB?.email) {
      throw ApiError.UnauthorizedError();
    }

    // 4. Generate tokens and get user info
    const tokensAndUser = await this._generateAndSaveTokens(tokenFromDB.email);
    return tokensAndUser;
  }

  // --- Get All users
  async getAllUsers() {
    const users = await db.query(`SELECT * FROM users`);
    return users.rows;
  }

  // --- Get All users
  async getUser(email) {
    const users = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    return users.rows[0] ?? [];
  }

  // --- Get user info, generate tokens, save tokens, return tokens and user info
  async _generateAndSaveTokens(email) {
    // 1. Get user Info by token email and save as data transfer object
    const user = await this.getUser(email);
    const userDto = new UserDto(user);

    // 2. Generate Access and Refresh tokens and update user info
    const { accessToken, refreshToken } = tokenService.generationTokens({ ...userDto });

    // 3. Save token by token service
    await tokenService.saveToken(email, refreshToken);

    // 4. Return tokens and userDto
    return { accessToken, refreshToken, user: userDto };    
  }

}

module.exports = new UserService();
