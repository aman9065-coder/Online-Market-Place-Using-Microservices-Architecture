const express = require('express');
const createAuthMiddleware = require('../middlewares/auth.middlewares');
const paymentController = require('../controllers/payment.controllers');

const router = express.Router();

router.post('/create/:orderId',createAuthMiddleware(['user']),paymentController.createPayment);
router.post('/verify',createAuthMiddleware(['user']),paymentController.verifyPayment);




module.exports = router;