const {body ,param, validationResult} = require("express-validator");
const mongoose = require("mongoose");


const validateResult = (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    next();
}

const validateAddItemToCart = [
    body('productId').isString().withMessage('product id must be string').
    custom(value =>  mongoose.Types.ObjectId.isValid(value)).
    withMessage('Invalid product id format'),
    body('quantity').isInt({gt:0}).withMessage('Quantity must be positive number'),
    validateResult
];

const validateUpdateCart = [
    param('productId').custom(value => mongoose.Types.ObjectId.isValid(value))
        .withMessage('Invalid product id format'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be positive number'),
    validateResult
];

module.exports = {
    validateAddItemToCart,validateUpdateCart
}