require('dotenv').config(); // For .env configuration
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middlewares/error-middleware');

// -- Routers
const routerDB = require('./router/db');
const routerUser = require('./router/user');
const routerPdf = require('./router/pdf');

const app = express();
const PORT = process.env.PORT || 5000;

// console.log('!!!', process.env.CLIENT_URL);

// -- Middleware
app.use(express.json()); // Read response as json
app.use(cookieParser());
app.use(cors({ // Server mode for browser
  // withCredentials: true,
  // credentials: 'include',
  credentials: true,
  origin: process.env.CLIENT_URL,
})); 

// -- File uploads
app.use(fileUpload());

// -- Routes
app.use('/api/create-db', routerDB);
app.use('/api/user', routerUser);
app.use('/api/pdf', routerPdf);

app.use(errorMiddleware); // Error middleware, should be last middleware

const start = () => {
  try {
    app.listen(PORT, () => console.log(`Server was started at port ${PORT}!`));
  } catch(e) {
    console.error(e);
  }
}

start();