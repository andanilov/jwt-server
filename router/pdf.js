const Router = require('express').Router;
const pdfController = require('../controllers/pdf-controller');
const router = new Router();
const authMiddleware = require('../middlewares/auth-middleware');

// -- Update Db by table file
router.post('/addfile',
  authMiddleware,
  pdfController.addDbByFile
);

router.get('/product/:code',
  authMiddleware,
  pdfController.getProductByCode
);

module.exports = router;
