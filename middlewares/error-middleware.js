const ApiError = require('../exceptions/api-error');

module.exports = function (err, req, res, next) {
  console.log(err);

  // Send error to client
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      errors: err.errors,
    })
  }

  // If unknown error send server error to client
  return res.status(500).json({ message: 'Непредвиденная ошибка!' });
}