require('dotenv').config(); // For .env configuration
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const router = require('./router');
const errorMiddleware = require('./middlewares/error-middleware');

/* --- Models --- */
const UserModel = require('./models/user-model');
const TokenModel = require('./models/token-model');
const userModel = new UserModel();
const tokenModel = new TokenModel();
userModel.createModel();
tokenModel.createModel();

const app = express();
const PORT = process.env.PORT || 8080;

/* --- Middleware --- */
app.use(express.json()); // Read response as json
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
})); // Server mode for browser
app.use('/api/user', router);
app.use(errorMiddleware); // Error middleware, should be last middleware

const start = () => {
  try {

    app.listen(PORT, () => console.log(`Server was started at port ${PORT}!`));
  } catch(e) {
    console.error(e);
  }
}

start();