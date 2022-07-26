const db = require('../db');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const sql = require('yesql').pg
const generatePassword = require('password-generator');
const emailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');
const getPeriodByString = require('../utils/getPeriodByString');
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
    const hashPass = await this._getHashPass(password, 3);

    // 3. Get random string for actiovation
    const activationStr = uuid.v4();

    // 4. Add user to DB
    const user = await (async function() {
      try {
        const newUser = await db.query(`INSERT INTO users
          (email, password, name, isactivated, created, activationlink, access)
          VALUES ($1, $2, $3, $4, current_timestamp, $5, 0) RETURNING *`,           
          [email, hashPass, name, false, activationStr]);
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

  // --- REMEMBER
  async remember(email, ip) {
    // 1. If the email doesn't exists
    const userExist = await db.query(`SELECT email FROM users WHERE email=$1`, [email]);
    if (!userExist.rows.length) {
      throw ApiError.BadRequest(`Пользователя с данным email ${email} не существует!`);
    }

    // 2. Generate random string to reset password
    const resetStr = uuid.v4();

    // 3. Set resetLInk and time to DB
    const user = await (async function() {
      try {
        await db.query(`UPDATE users SET resetlink=$1, resetlinkcreated=current_timestamp WHERE email=$2`, [resetStr, email]);
      } catch (e) {
        throw ApiError.BadRequest(`Не удалось обновить данные пользователя ${email} : ${e.message}`);
      }      
    }());

    // 4. Send new password to user by email
    await emailService.sendResetPasswordLinkMail(email, `${process.env.API_URL}/api/user/reset/${resetStr}`, ip);
  }

  // --- RESET PASSWORD
  async reset(resetLink) {    
    // 1. Check resetLink exists
    const user = await db.query(`SELECT email, extract(epoch from (now() - resetlinkcreated)) AS period FROM users WHERE resetlink=$1`, [resetLink]);
    if (!user.rows.length) {
      throw ApiError.BadRequest('Некорректная ссылка сброса пароля!');
    }

    // 2. Check if resetLink is fresh
    if (~~+user.rows[0].period * 1000 > getPeriodByString(process.env.RESET_LINK_PERIOD)) {
      throw ApiError.BadRequest('Срок действия ссылки сброса пароля истёк!');
    }

    // 3. Generate new password and hash
    const password = generatePassword(8, false);
    const hashPass = await bcrypt.hash(password, 3);

    // 4. Add new password to DB
    await (async function() {
      try {
        await db.query(`UPDATE users SET password=$1, resetlinkcreated=NULL, resetlink=NULL WHERE email=$2`, [hashPass, user.rows[0].email]);
      } catch (e) {
        throw ApiError.BadRequest(`Не удалось обновить данные пользователя ${user.rows[0].email} : ${e.message}`);
      }      
    }());

    // 5. Send new password to user by email
    await emailService.sendNewPasswordMail(user.rows[0].email, password);
  }

  // --- LOGIN
  async activate(activationLink) {
    // 1. Search for user by actiovation link
    const user = await db.query(`SELECT email FROM users WHERE activationlink=$1`, [activationLink]);
    if (!user.rows.length || !user.rows[0]?.email ) {
      throw ApiError.BadRequest('Некорректная ссылка активации!');
    }

    // 2. Update user col isactivated
    await db.query(`UPDATE users SET isactivated=true WHERE email=$1`, [user.rows[0].email]);
  }

  async login(email, password) {
    await this._getUser(email, password);
    return await this._generateAndSaveTokens(email); 
  }

  async changeUserData({ actor, user, password, name, newPassword, access }) {
    // 1. User changing himself
    if (actor === user) {
      const actorDb = await this._getUser(user, password);

    // 2. Actor changing a user  
    } else {
      const actorDb = await this.getUser(actor);

      if (!actorDb.access || actorDb.access < process.env.ADMIN_ACCESS_NUM) {
        throw ApiError.BadRequest('Недостаточно прав для выполнения действия!');
      }
    }

    // 3. Validate new password
    if (newPassword && newPassword.trim().length < process.env.USER_PASSWORD_MIN_LEN) {
      throw ApiError.BadRequest('Новый пароль невалидный!');
    }

    // 4. set updateArr
    const updateArr = {};
    name !== undefined && (updateArr.name = name);
    access !== undefined && (updateArr.access = (access >= process.env.ADMIN_ACCESS_NUM)
      ? process.env.ADMIN_ACCESS_NUM - 1
      : access);
    newPassword && (updateArr.password = await this._getHashPass(newPassword));

    // 5. Generate update params list from update arr
    const updateParams = Object.keys(updateArr).reduce((strArr, key) =>
      [...strArr, `${key}=:${key}`], []).join(', ');

    // 6. Change user data
    await (async function() {
      try {
        await db.query(sql(`UPDATE users SET ${updateParams} WHERE email=:user`)({user, ...updateArr}));
      } catch (e) {
        throw ApiError.BadRequest(`Не удалось обновить данные пользователя ${user} : ${e.message ?? ''}`);
      }      
    }());
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
    const users = await db.query(`SELECT *, to_char(created, 'YYYY-MM-DD HH:MI:SS') AS created FROM users`);
    return users.rows;
  }

  // --- Get All users
  async getUser(email) {
    const users = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    return users.rows[0] ?? [];
  }

  // --- Is the user an admin
  // async isAdmin(email) {
  //   const access = await this.getUser(email).access;
  //   return access >= process.env.ADMIN_ACCESS_NUM;
  // }

  // --- Delete user
  async deleteUser(actorEmail, actorAccess, email) {
    // 1. Check access
    if (actorEmail !== email && actorAccess < process.env.ADMIN_ACCESS_NUM) {
      throw ApiError.BadRequest('Недостаточно прав для удаления пользователя!');
    }

    // 1. Delete user if exists
    await db.query(`DELETE FROM users WHERE email=$1`, [email]);
    await db.query(`DELETE FROM token WHERE email=$1;`, [email]);
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

  // --- Check user and his password
  async _getUser(email, password) {
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

    return user.rows[0];
  }

  async _getHashPass(password) {
    return await bcrypt.hash(password, 3);
  }

}

module.exports = new UserService();
