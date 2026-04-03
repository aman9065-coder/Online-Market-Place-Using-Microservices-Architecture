const express = require('express');
const validator = require('../middlewares/validator.middleware');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware')

const router = express.Router();

router.post('/register',validator.registerUserValidation,authController.registerUser);
router.post('/login',validator.loginUserValidation,authController.loginUser);
router.get('/me',authMiddleware.authMiddleware,authController.getUser);
router.get('/logout',authController.logoutUser);
router.get('/user/me/addresses',authMiddleware.authMiddleware,authController.getUserAddress);
router.post('/user/me/addresses',validator.addUserAddressValidation,authMiddleware.authMiddleware,authController.addUserAddress);
router.delete('/user/me/addresses/:addressesId',authMiddleware.authMiddleware,authController.deleteUserAddress);


module.exports = router;