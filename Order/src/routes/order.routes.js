const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middlewares');
const orderController = require('../controllers/order.controllers');
const validation = require('../middlewares/validation.middlewares');

const router = express.Router();

router.post('/',createAuthMiddleware(['user']),validation.addUserAddressValidation,orderController.createOrder);
router.get('/me',createAuthMiddleware(['user']),orderController.getMyOrder);
router.get('/:id',createAuthMiddleware(['user']),orderController.getOrderById);
router.get('/:id/cancel',createAuthMiddleware(['user']),orderController.cancelOrderById);
router.patch('/:id/address',createAuthMiddleware(['user']),validation.addUserAddressValidation,orderController.updateOrderAddress);

module.exports = router;