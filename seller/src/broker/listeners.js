const userModel = require('../models/user.model');
const orderModel = require('../models/order.models');
const productModel = require('../models/product.model');
const { subscribeToQueue } = require('./broker');
const paymentModel = require('../models/payment.models');


module.exports = function () {
    subscribeToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED', async (user) => {
        const { _id, ...userData } = user;
        await userModel.findOneAndUpdate(
            { $or: [{ username: user.username }, { email: user.email }] },
            { $set: userData },
            { upsert: true, new: true }
        );
    });

    subscribeToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED', async (product) => {
        const { _id, ...productData } = product;
        await productModel.findOneAndUpdate(
            { _id: product._id },
            { $set: productData },
            { upsert: true, new: true }
        );
    });

    subscribeToQueue('ORDER_SELLER_DASHBOARD.ORDER_CREATED', async (orders) => {
        const { _id, ...orderData } = orders;
        await orderModel.findOneAndUpdate(
            { _id: orders._id },
            { $set: orderData },
            { upsert: true, new: true }
        );
    });

    subscribeToQueue('ORDER_SELLER_DASHBOARD.ORDER_UPDATED', async (data) => {
        await orderModel.findByIdAndUpdate(
            data.orderId,
            { status: data.status }
        );
    });

    subscribeToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT.CREATED', async (payment) => {
        const { _id, ...paymentData } = payment;
        await paymentModel.findOneAndUpdate(
            { order: payment.order },
            { $set: paymentData },
            { upsert: true, new: true }
        );
    });

    subscribeToQueue('PAYMENT_SELLER_DASHBOARD.PAYMENT.UPDATED', async (payment) => {
        const { _id, ...paymentData } = payment;
        await paymentModel.findOneAndUpdate(
            { order: payment.order },
            { $set: paymentData }
        );
    });
}