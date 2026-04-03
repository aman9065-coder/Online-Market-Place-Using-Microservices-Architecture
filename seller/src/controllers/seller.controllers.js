const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const orderModel = require('../models/order.models');
const paymentModel = require('../models/payment.models');


async function getMetrics(req, res) {
    try {
        const sellerId = req.user.id;

        const products = await productModel.find({ seller: sellerId });
        console.log(products);


        const productIds = products.map((p) => p._id);
        // console.log(productIds);


        let sales = 0; //kitna order sale
        let revenue = 0; // kitna paisa
        let productSales = {}; // top product

        const orders = await orderModel.find({
            'items.product': { $in: productIds },
            'status': { $in: ["CONFIRMED", "DELIEVERED", "COMPLETED", "SHIPPED"] }
        });
        // console.log(orders);


        orders.forEach((order) => {
            // console.log(order);

            order.items.forEach((item) => {
                // console.log(productIds.some(id => id.equals(item.product)));

                if (productIds.map(id => id.equals(item.product))) {
                    sales += item.quantity;
                    revenue += item.price.amount * item.quantity;
                    productSales[item.product] = (productSales[item.product] || 0) + item.quantity;
                }
            })
        });

        const topProducts = Object.entries(productSales).
            sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([product, quantity]) => {
                const prod = products.find((p) => p._id.equals(product));
                return prod ? { id: prod._id, title: prod.title, sold: quantity } : null;
            })
            .filter(Boolean);

        return res.json({
            sales,
            revenue,
            topProducts
        });
    }
    catch (error) {
        console.error("Error fetching metrics:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

async function getOrders(req, res) {
    try {
        const sellerId = req.user.id;
        const products = await productModel.find({ seller: sellerId });
        // console.log(products);
        
        const productIds = products.map((p) => p._id);
        // console.log(productIds);

        const orders = await orderModel.find({
            'items.product': { $in: productIds }
        }).sort({ createdAt: -1 });

        // console.log(orders);
        

        const filteredOrders = orders.map((order) => {
            const filteredItems = order.items.filter((item) =>
                productIds.map(id => id.equals(item.product))
            );

            return {
                ...order.toObject(),
                items: filteredItems
            }
        }).filter((order) => order.items.length > 0);

        return res.json(filteredOrders);
        
    } catch (error) {
        console.error("Error fetching orders:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
async function getProducts(req, res) {
    try{
        const sellerId = req.user.id;

        const products = await productModel.find({
            seller:sellerId
        }).sort({createdAt:-1});

        return res.json(products);

    }catch (error) {
        console.error("Error fetching products:", error)
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}




module.exports = {
    getMetrics, getOrders, getProducts
}