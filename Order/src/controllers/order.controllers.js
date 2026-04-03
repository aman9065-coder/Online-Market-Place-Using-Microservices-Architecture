const mongoose = require('mongoose');
const orderModel = require('../models/order.models');
const axios = require('axios');
const { publishToQueue } = require('../broker/broker');


async function createOrder(req, res) {
  const user = req.user;
  const token = req.cookies?.token || req.headers?.Authorization?.split(' ')[1];

  try {
    const cartResponse = await axios.get(':5002/api/cart/items', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const cartItems = cartResponse.data.cart.items;

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    const products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
      return (await axios.get(`http://vendex-alb-1-1449366652.ap-south-1.elb.amazonaws.com/api/products/${item.productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })).data.product;
    }));

    let priceAmount = 0;
    const orderItems = cartResponse.data.cart.items.map((item) => {
      const product = products.find((p) => p._id == item.productId);

      if (product.stock < item.quantity) {
        throw new Error(`product ${product.title} is out of stock or insufficient stock`);
      }

      const itemTotal = product.price.amount * item.quantity;

      priceAmount += itemTotal;

      return {
        product: item.productId,
        quantity: item.quantity,
        price: {
          amount: product.price.amount,
          currency: product.price.currency
        }
      }

      // console.log(orderItems);

    });
    const orders = await orderModel.create({
      user: user.id,
      items: orderItems,
      totalAmount: {
        amount: priceAmount,
        currency: "INR"
      },
      status: "PENDING",
      shippingAddress: req.body.shippingAddress,
    });
    
    await publishToQueue('ORDER_SELLER_DASHBOARD.ORDER_CREATED',orders);
    res.status(201).json(orders);
  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }




}

async function getMyOrder(req, res) {
  const user = req.user;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  try {

    const orders = await orderModel.find({
      user: user.id
    }).skip(skip).limit(limit).sort({ createdAt: -1 });;
    const totalOrders = await orderModel.countDocuments({ user: user.id });
    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders,
      meta: {
        total: totalOrders,
        totalPages,
        hasNextPage: page * limit < totalOrders,
        hasPrevPage: page > 1,
        limit,
        page
      }
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error", err
    });
  }

}
async function getOrderById(req, res) {
  const user = req.user;

  const orderId = req.params.id;

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "order not found!"
      });
    }

    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden:you don't have access"
      });
    }

    res.status(200).json({ order });

  } catch (err) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

async function cancelOrderById(req, res) {
  const user = req.user;
  const orderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "invalid order id" });
  }


  try {

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "order not found!"
      });
    }

    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden:you don't have access to this order"
      });
    }
    if (order.status !== "PENDING") {
      return res.status(409).json({
        message: "order cannot be cancelled at this status"
      });
    }
    order.status = "CANCELLED";

    await order.save();

    res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

async function updateOrderAddress(req, res) {
  const user = req.user;
  const orderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      message: "invalid order id"
    });
  }
  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "order not found!"
      });
    }

    if (order.user.toString() !== user.id) {
      return res.status(403).json({
        message: "Forbidden:you don't have access to this order"
      });
    }
    if (order.status !== "PENDING") {
      return res.status(409).json({
        message: "order cannot be updated at this status"
      });
    }
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.country ||
      !shippingAddress.zip
    ) {
      return res.status(400).json({
        message: "complete shippingAddress is required"
      });
    }


    order.shippingAddress = {
      street: req.body.shippingAddress.street,
      city: req.body.shippingAddress.city,
      state: req.body.shippingAddress.state,
      country: req.body.shippingAddress.country,
      zip: req.body.shippingAddress.zip,
    }

    await order.save();

    res.status(200).json({ order });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
}

module.exports = {
  createOrder, getMyOrder, getOrderById, cancelOrderById, updateOrderAddress
}