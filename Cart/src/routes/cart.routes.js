const express = require('express');
const cartController = require('../controllers/cart.controllers');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const validateCart = require('../middlewares/validation.middleware');


const router = express.Router();


router.post('/items',createAuthMiddleware(['user']),validateCart.validateAddItemToCart,cartController.addItemToCart);
router.patch('/items/:productId',createAuthMiddleware(['user']),validateCart.validateUpdateCart,cartController.updateItemToCart);
router.delete('/items/:productId',createAuthMiddleware(['user']),cartController.deleteItemToCart);
router.delete('/items',createAuthMiddleware(['user']),cartController.clearCart);
router.get('/items',createAuthMiddleware(['user']),cartController.getCart);

module.exports = router;