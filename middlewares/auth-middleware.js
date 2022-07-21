const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');

module.exports = async function (req, res, next) {
  try {
    // 1. Get token info from request Header if no token info to unauthorized error
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw ApiError.UnauthorizedError();
    }

    // 2. Get token body from token info if no token to unauthorized error
    const tokenAccess = authHeader.split(' ')[1];
    if (!tokenAccess) {
      throw ApiError.UnauthorizedError();
    }

    // 3. Access token validate and get user info from this token
    const userData = await tokenService.validateAccessToken(tokenAccess);
    if (!userData) {
      throw ApiError.UnauthorizedError();
    }

    // 4. Set user info from token to request.user
    req.user = userData;

    // 5. next - go to next middleware
    next();
    
  } catch (e) {
    return next(ApiError.UnauthorizedError() );
  }
}