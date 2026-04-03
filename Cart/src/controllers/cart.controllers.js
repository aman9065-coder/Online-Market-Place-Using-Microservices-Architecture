const cartModel = require('../models/cart.models');
const mongoose = require('mongoose');


async function addItemToCart(req, res) {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ message: "productId and quantity are required" });
    }


    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
        cart = new cartModel({ user: user.id, items: [] });
    }

    const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() == productId);

    if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        cart.items.push({ productId, quantity: quantity });
    }

    await cart.save();

    res.status(200).json({
        message: "Item added to cart",
        cart
    });
}
async function updateItemToCart(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ message: "productId and quantity are required" });
    }


    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
        return res.status(404).json({
            message: "cart not found"
        });
    }

    const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() == productId);

    if (existingItemIndex < 0) {
        return res.status(404).json({
            message: "items not found"
        })
    } else {
        cart.items[existingItemIndex].quantity = quantity;
    }

    await cart.save();

    res.status(200).json({
        message: "cart updated",
        cart
    });
}
async function deleteItemToCart(req, res) {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: 'Invalid productId' });
}


    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
        return res.status(404).json({
            message: "cart not found"
        });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter((item)=>item.productId.toString() !== productId);

    if(cart.items.length === initialLength){
        return res.status(404).json({
            message:"items not found"
        });
    }

    await cart.save();

    res.status(200).json({
        message: "Item removed from cart",
        cart
    });
}
async function getCart(req, res) {
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    if (!cart) {
        cart = new cartModel({ user: user.id, items: [] });
        await cart.save();
    }

    res.status(200).json({
        message: "cart fetched",
        cart,
        totals: {
            itemQuantity: cart.items.length,
            totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity,0)
        }
    });
}
async function clearCart(req, res) {

    const user = req.user;

    const cart = await cartModel.findOne({user:user.id});

    if(!cart){
        return res.status(404).json({
            message:"cart not found!"
        });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
        message: "cart cleared successfully!",
        cart,
    });
}


module.exports = {
    addItemToCart, updateItemToCart, getCart , deleteItemToCart , clearCart
}