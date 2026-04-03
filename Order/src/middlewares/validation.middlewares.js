const { body, validationResult } = require('express-validator');

const responseValidationResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const addUserAddressValidation = [
    body('shippingAddress.street')
        .notEmpty().withMessage('street is required')
        .isString().withMessage('street must be string'),

    body('shippingAddress.city')
        .notEmpty().withMessage('city is required')
        .isString().withMessage('city must be string'),

    body('shippingAddress.state')
        .notEmpty().withMessage('state is required')
         .isString().withMessage('state must be string'),

    body('shippingAddress.country')
        .notEmpty().withMessage('country is required')
         .isString().withMessage('country must be string'),

    body('shippingAddress.zip')
        .isPostalCode('any').withMessage('invalid zip/postal code')
        .notEmpty().withMessage('zip code is required')
        .isString().withMessage('zip code must be string'),
    responseValidationResult
]

module.exports = {
    addUserAddressValidation
}