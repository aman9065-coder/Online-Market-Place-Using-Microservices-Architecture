const redis = require('../db/redis');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');


async function authMiddleware(req, res, next) {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized User" });
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const isBlacklisted = await redis.get(`blacklist_${token}`);

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Token has been blacklisted"
            });
        }

        const user = await userModel.findOne({
            _id: decoded.id
        }).select('-password');
        if (!user) {                                   
            return res.status(404).json({
                message: "user not found!"
            });
        }

        req.user = user;
        next();


    } catch (error) {
        res.status(401).json({ message: "Unauthorized invalid token" });
    }

}


module.exports = {
    authMiddleware
}