const { publishToQueue } = require('../broker/broker');
const productModel = require('../models/product.model');
const uploadImage = require('../service/imagekit.service');
const mongoose = require('mongoose');


async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency, category } = req.body;

        const seller = req.user.id;

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency
        }


        const images = await Promise.all(
            (req.files || []).map((file) => {
                return uploadImage({ buffer: file.buffer })
            }));

        const product = await productModel.create({
            title, description, price, images, category, seller
        });

        await publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED',product);
        await publishToQueue('PRODUCT_NOTIFICATION.PRODUCT.CREATED',{
            productId:product._id,
            sellerId:seller,
            email:req.user.email,
            username:req.user.username
        });

        res.status(201).json({
            message: "product created successfully!",
            data: product
        });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }

}

async function getProducts(req, res) {
    const { q, minPrice, maxPrice, skip = 0, limit = 20 } = req.query;

    const filter = {};

    if (q) {
        filter.$text = { $search: q }
    }
    if (minPrice) {
        filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minPrice) }
    }
    if (maxPrice) {
        filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxPrice) }
    }

    const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20));

    res.status(200).json({
        message: "product fetched successfully",
        data: products
    });
}
async function getProductById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "product not found"
            });
        }

        res.status(200).json({ product: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function updateProduct(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    try {
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "product not found"
            });
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

         if (req.body.title) product.title = req.body.title;
        if (req.body.description) product.description = req.body.description;
        if (req.body.category) product.category = req.body.category;

        // ✅ Price mapping (VERY IMPORTANT)
        if (req.body.priceAmount || req.body.priceCurrency) {
            product.price = {
                amount: req.body.priceAmount ?? product.price.amount,
                currency: req.body.priceCurrency ?? product.price.currency
            };
        }

        // ✅ Images update (safe)
        if (req.files && req.files.length > 0) {
            product.images = req.files.map(file => ({
                url: file.path,
                thumbnail: file.path,
                id: file.filename
            }));
        }

        await product.save();

        return res.status(200).json({ product: product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function deleteProduct(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    try {
        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: "product not found"
            });
        }
        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }


        await productModel.findOneAndDelete({ _id: id });

        return res.status(200).json({ message: "product deleted successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getProductBySeller(req, res) {
    const { skip = 0, limit = 20 } = req.query;
    const seller = req.user;

    const product = await productModel.find({ seller: seller.id }).skip(skip).limit(Math.min(limit, 20));

    return res.status(200).json({
        data: product
    });

}
module.exports = {
    createProduct, getProducts, getProductById, updateProduct, deleteProduct, getProductBySeller
}