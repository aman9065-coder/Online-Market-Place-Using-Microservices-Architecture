const express = require('express');
const router = express.Router();
const multer = require('multer');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const productController = require('../controllers/product.controller');
const productValidator = require('../middlewares/validator.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.array('images'), createAuthMiddleware(['admin', 'seller']), productValidator.productValidationRules, productController.createProduct);
router.get('/',productController.getProducts);
router.patch('/:id', upload.array('images'),createAuthMiddleware(['seller']),productController.updateProduct);
router.delete('/:id',createAuthMiddleware(['seller']),productController.deleteProduct);
router.get('/seller',createAuthMiddleware(['seller']),productController.getProductBySeller);
router.get('/:id',productController.getProductById);


module.exports = router;