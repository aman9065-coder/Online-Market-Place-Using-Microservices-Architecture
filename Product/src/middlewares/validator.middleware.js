const { body, validationResult } = require('express-validator');

const responseValidationResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Validation rules for creating a product
const productValidationRules = [
    body('title').trim()
        .isString().withMessage('title must be a string')
        .notEmpty().withMessage('title is required'),
    body('description')
        .optional()
        .trim()
        .isString().withMessage('description must be a string')
    .isLength({ max: 500 })
        .withMessage('description max length is 500 characters'),
    body('priceAmount')
        .notEmpty()
        .withMessage('price amount is required')
        .isFloat({ gt: 0 })
        .withMessage('price amount must be number > 0'),

    body('priceCurrency')
        .optional()
        .isIn(['USD', 'INR'])
        .withMessage('priceCurrency must be USD or INR'),
    body('category')
        .optional()
        .isString().withMessage('category must be a string'),
    responseValidationResult
];




module.exports = {
    productValidationRules,
};