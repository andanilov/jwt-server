const userService = require('../service/user-service');
const { validationResult } = require('express-validator');
const ApiError = require('../exceptions/api-error');
const getPeriodByString = require('../utils/getPeriodByString');

// -- Check if middleware validation error exists
const validateRequestData = (req) => {
  const errors = validationResult(req);  
  if (!errors.isEmpty()) {
    throw ApiError.BadRequest(`Неверные данные!`, errors);
  }
}

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
        // secure: false, // secure: true, // for https://
       });

      // 4. get user data
      const user = await userService.getUser(email);

      // 5. Send response
      return res.json(user);

    } catch (e) {
      next(e); // go to middleware (error)
    }
  }

  // --- REMEMBER
  async remember(req, res, next) {
    try {
      // 0. Check request body rows
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest('Ошибка при валидации', errors));
      }

      // 1. Get user info from front
      const { email } = req.body;
     
      // 2. User registration by service
      const userData = await userService.remember(email, req.socket.remoteAddress);

      // 3. Send response
      return res.json({ success: 'На ваш e-mail отправлены инструкции по смене пароля!' });
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }

  // --- REMEMBER
  async reset(req, res, next) {
    try {
      await userService.reset(req.params.link);
      return res.redirect(process.env.CLIENT_URL);
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
        samSite: 'none',
        maxAge: getPeriodByString(process.env.JWT_REFRESH_KEY),
        httpOnly: true,
        secure: false, // secure: true, // for https://
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
        samSite: 'none',
        maxAge: getPeriodByString('30d'),
        httpOnly: true,
      })

      // 5. Send response
      return res.json(userData);
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }

  // --- Change User data
  async changeData(req, res, next) {
    try {
      console.log('Here we will change user data!', req.body);

      // 1. Check data
      validateRequestData(req);

      // 2. Get data from request
      const { actor, user, password, name, newPassword, role } = req.body;      

      // 3. If new password exists
      await userService.changeUserData({ actor, user, password, name, newPassword, role });

      // 4. Send response
      return res.json();
    } catch (e) {
      console.log(e);
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
  
  // --- Delete user
  async deleteUser(req, res, next) {
    try {
      // 1. Get data from request
      const [actor, userEmail] = [req?.user, req.body?.email];

      // 2. Check data
      if (!actor?.email || !actor?.access || !userEmail) {
        throw ApiError.BadRequest(`Недостаточно данных!`, errors);
      }

      // 3. Try to delete user by service
      await userService.deleteUser(actor.email, actor.access, userEmail);    
      res.json({});
    } catch (e) {
      next(e); // go to middleware (error)
    }
  }
}

module.exports = new UserController();
