require('dotenv').config(); // For .env configuration
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middlewares/error-middleware');

// -- Routers
const routerDB = require('./router/db');
const routerUser = require('./router/user');

const app = express();
const PORT = process.env.PORT || 5000;

// -- Middleware
app.use(express.json()); // Read response as json
app.use(cookieParser());
app.use(cors({ // Server mode for browser
  credentials: true,
  origin: process.env.CLIENT_URL,
})); 

// -- Routes
app.use('/api/create-db', routerDB);
app.use('/api/user', routerUser);

app.use(errorMiddleware); // Error middleware, should be last middleware

const start = () => {
  try {

    app.listen(PORT, () => console.log(`Server was started at port ${PORT}!`));
  } catch(e) {
    console.error(e);
  }
}

start();