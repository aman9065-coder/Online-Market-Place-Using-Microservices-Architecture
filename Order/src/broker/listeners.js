const orderModel = require('../models/order.models');
const { subscribeToQueue, publishToQueue } = require('../broker/broker');

module.exports = function () {
    subscribeToQueue('PAYMENT_ORDER.PAYMENT_COMPLETED', async (data) => {
        await orderModel.findByIdAndUpdate(
            data.orderId,
            { status: data.status }
        );
        console.log(`Order ${data.orderId} status updated to ${data.status}`);

        // Seller dashboard ko bhi update bhejo
        await publishToQueue('ORDER_SELLER_DASHBOARD.ORDER_UPDATED', {
            orderId: data.orderId,
            status: data.status
        });
    });
}