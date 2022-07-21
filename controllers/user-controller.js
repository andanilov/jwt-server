const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const getPeriodByString = require('../utils/getPeriodByString');

class UserController {
  // --- REGISTRATION
  async registration(req, res, next) {
    try {
      // 0. Check request body rows
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Ошибка при валидации', errors));
      }

      // 1. Get user info from front
      const { email, password, name } = req.body;
     
      // 2. User registration by service
      const userData = await userService.registration(email, password, name);

      // 3. Put user refresh token to cookie !! app.use(cookieParser());
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: getPeriodByString('30d'),
        httpOnly: true, // close browser access to this cookie!
        // secure: true, // for https://
       });

      // 4. get user data
      const user = await userService.getUser(email);

      // 5. Send response
      return res.json(user);

    } catch (e) {
      next(e); // go to middleware (error)
    }
  }

  // --- LOGIN
  async login(req, res, next) {
    try {
      // 0. Check request body rows
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ApiError.BadRequest(`Неверные данные!`, errors);
      }

      // 1. Get data from the front
      const { email, password } = req.body;

      // 2. Check if user exists and the password by service
      const userData = await userService.login(email, password);

      // 3. Set refresh token to cookie
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: getPeriodByString('30d'),
        httpOnly: true,
      });

      // 5. Send response
      return res.json(userData);
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }
  
  // --- LOGOUT
  async logout(req, res, next) {
    try {
      // -- Delete refresh token
      // 1. Get refresh token from cookie
      const { refreshToken } = req.cookies;

      // 2. LogOut by user service and refresh token
      const token = await userService.logout(refreshToken);

      // 3. Delete refresh token from cookies
      res.clearCookie('refreshToken');

      // 4. Send logout result to client
      res.json(token);
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }
  
  // --- USER ACTIOVATION
  async activate(req, res, next) {
    try {
      await userService.activate(req.params.link);
      return res.redirect(process.env.CLIENT_URL);
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }
  
  // --- REFRESH TOKEN
  async refresh(req, res, next) {
    try {
      // 1. Get refresh token from cookie
      const { refreshToken } = req.cookies;

      // 2. Refresh token by user service
      const userData = await userService.refresh(refreshToken);

      // 3. Set refresh token to cookie
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: getPeriodByString('30d'),
        httpOnly: true,
      })

      // 5. Send response
      return res.json(userData);
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }
  
  // --- Try to get private date (all users)
  async getUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);      
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }

}

module.exports = new UserController();
