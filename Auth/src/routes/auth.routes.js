const express = require('express');
const validator = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router();
const {loginLimiter,registerLimiter} = require('../middlewares/rateLimit');

router.post('/register',registerLimiter,validator.registerUserValidation,authController.registerUser);

router.post('/login',loginLimiter,validator.loginUserValidation,authController.loginUser);
router.get('/me',authMiddleware.authMiddleware,authController.getUser);
router.get('/logout',authController.logoutUser);
router.get('/user/me/addresses',authMiddleware.authMiddleware,authController.getUserAddress);
router.post('/user/me/addresses',authMiddleware.authMiddleware,validator.addUserAddressValidation,authController.addUserAddress);
router.delete('/user/me/addresses/:addressesId',authMiddleware.authMiddleware,authController.deleteUserAddress);


module.exports = router;