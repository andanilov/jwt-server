const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const router = new Router();
const { body } = require('express-validator'); // Body request validate
const authMiddleware = require('../middlewares/auth-middleware');

// -- Create DB
// router.get('/create-db', model.create);

// -- Registration
router.post('/registration', // url
  body('email').isEmail(), // maddleware: send email validate by express-validator lib to controller
  body('password').isLength({ min: process.env.USER_PASSWORD_MIN_LEN, max: 32 }), // middleware: send pass validate by express-validator lib to controller
  userController.registration // Controller
);

// -- Activate user 
router.get('/activate/:link', userController.activate);

// -- Login
router.post('/login', 
  body('email').isLength({ max: 255 }),
  body('password').isLength({ min: process.env.USER_PASSWORD_MIN_LEN, max: 255 }),
  userController.login
);

// -- Remember
router.post('/remember', 
  body('email').isLength({ max: 255 }),
  userController.remember
);

// -- Reset user password by reset link 
router.get('/reset/:link', userController.reset);

// -- LogOut
router.post('/logout', userController.logout);

// -- Refresh token
router.get('/refresh', userController.refresh);

router.post('/changeData', 
  body('actor').isEmail(),
  body('user').isEmail(),
  body('password').isLength({ min: process.env.USER_PASSWORD_MIN_LEN, max: 255 }),
  userController.changeData,
);

// -- Try to get All users (private data)
router.get('/users', 
  authMiddleware,
  userController.getUsers
);

// -- Delete user
router.post('/delete', 
  authMiddleware,
  userController.deleteUser
);

module.exports = router;
