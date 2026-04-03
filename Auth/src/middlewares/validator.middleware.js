const { body, validationResult } = require('express-validator');

const responseWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}


const registerUserValidation = [
    body('username').isString().withMessage('username must be string')
        .isLength({ min: 3 }).withMessage('username must be atleast 3 characters long'),
    body('email').isEmail().withMessage('invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    body('fullname.firstname').isString().withMessage('first name must be string')
        .notEmpty().withMessage('first name is required'),
    body('fullname.lastname').isString().withMessage('last name must be string')
        .notEmpty().withMessage('last name is required'),
    body('role').
        optional()
        .isIn(['user', 'seller'])
        .withMessage("role must be either 'user' or 'seller'"),

    responseWithValidationErrors

];

const loginUserValidation = [
    body('username').isString().withMessage('username must be string')
        .isLength({ min: 3 }).withMessage('username must be atleast 3 characters long')
        .optional(),
    body('email').isEmail().withMessage('invalid email format').optional(),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    body().custom(body => {
        if (!body.username && !body.email) {
            throw new Error("Either username or email is required")
        }
        return true;
    }),
    responseWithValidationErrors
]

const addUserAddressValidation = [
    body('addresses').isArray({ min: 1 }).withMessage("At least one address is required"),
    body('addresses.*.street')
        .notEmpty().withMessage('street is required'),

    body('addresses.*.city')
        .notEmpty().withMessage('city is required'),

    body('addresses.*.state')
        .notEmpty().withMessage('state is required'),

    body('addresses.*.country')
        .notEmpty().withMessage('country is required'),

    body('addresses.*.zip')
        .isPostalCode('any').withMessage('invalid zip/postal code')
        .notEmpty().withMessage('zip code is required'),

    responseWithValidationErrors
]

module.exports = {
    registerUserValidation,
    loginUserValidation,
    addUserAddressValidation
}