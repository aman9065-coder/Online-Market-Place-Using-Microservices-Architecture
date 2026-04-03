const paymentModel = require('../models/payment.models');
const axios = require('axios');
const Razorpay = require('razorpay');
const { publishToQueue } = require('../broker/broker');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createPayment(req, res) {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    try {
        const orderId = req.params.orderId;

        const orderResponse = await axios.get(`http://vendex-alb-1-1449366652.ap-south-1.elb.amazonaws.com/api/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const price = orderResponse.data.order.totalAmount;

        const order = await razorpay.orders.create(price);

        const payment = await paymentModel.create({
            order: orderId,
            razorpayOrderId: order.id,
            user: req.user.id,
            price: {
                amount: order.amount,
                currency: order.currency
            },
        });
        await publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT.CREATED',payment);
        await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_INITIATED',{
            email:req.user.email,
            order:payment.order,
            username:req.user.username,
            amount:payment.price.amount/100,
            currency:payment.price.currency
        });
        return res.status(201).json({
            message: "payment initiated successfully!",
            payment
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal server error!"
        });

    }
}

async function verifyPayment(req, res) {
    const { paymentId, signature, razorpayOrderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    try {
        const { validatePaymentVerification } = require('../../node_modules/razorpay/dist/utils/razorpay-utils');

        const isValid = validatePaymentVerification(
             {
                order_id: razorpayOrderId,
                payment_id: paymentId
            },
            signature, secret
        );

    if (!isValid) {
        return res.status(400).json({
            message: "Invalid signature"
        })
    }

    const payment = await paymentModel.findOne({ razorpayOrderId });

    if (!payment) {
        return res.status(404).json({
            message: "payment not found"
        });
    }

    payment.paymentId = paymentId,
        payment.signature = signature,
        payment.status = "COMPLETED"

    await payment.save();

    await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_COMPLETED', {
        email: req.user.email,
        username: req.user.username,
        orderId: payment.order,
        paymentId: payment.paymentId,
        signature: payment.signature,
        price: {
            amount: payment.price.amount / 100,
            currency: payment.price.currency
        }
    });
    await publishToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT.UPDATED',payment);

    return res.status(200).json({
        message: "payment verified successfully",
        payment
    });

} catch (err) {
    console.log("payment verification failed!", err);
    await publishToQueue('PAYMENT_NOTIFICATION.PAYMENT_FAILED', {
        email: req.user.email,
        username: req.user.username,
        orderId: razorpayOrderId,
        paymentId: paymentId,
        signature: signature
    });
    res.status(500).json({
        message: "Internal server error!"
    });

}
}

module.exports = {
    createPayment, verifyPayment
}