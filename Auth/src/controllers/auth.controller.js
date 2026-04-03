const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const { publishToQueue } = require('../broker/broker');

async function registerUser(req, res) {
    try {
        const { username, email, password, fullname: { firstname, lastname }, role } = req.body;

        const isUserAlreadyExists = await userModel.findOne({
            $or: [
                {
                    username
                },
                {
                    email
                }
            ]
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({ message: "username or email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username, email, password: hash, fullname: { firstname, lastname }, role
        });

        await Promise.all(
            [
                publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
                    id: user._id,
                    username: username,
                    email: user.email,
                    fullname: user.fullname
                }),
                publishToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED', user)
            ]
        );

        const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: "user registered successfully!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                role: user.role,
            }

        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        const user = await userModel.findOne({
            $or: [
                {
                    username
                },
                {
                    email
                }
            ]
        }).select('+password');
        if (!user) {
            return res.status(401).json({ message: "invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: "invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "user loggedin successfully!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
                role: user.role,
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function getUser(req, res) {
    return res.status(200).json({
        message: "current user fetched successfully!",
        user: req.user

    })
}

async function logoutUser(req, res) {
    const token = req.cookies.token;

    if (token) {
        await redis.set(`blacklist_${token}`, `true`, `EX`, 24 * 60 * 60);
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: true
    });

    res.status(200).json({
        message: "user logout successfully!"
    });
}

async function getUserAddress(req, res) {
    try {
        const id = req.user._id;

        const user = await userModel.findOne({
            _id: id
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        res.status(200).json({
            message: "Address fetched successfully",
            address: user.addresses,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
}

async function addUserAddress(req, res) {
    try {
        const id = req.user._id;


        const { addresses } = req.body;

        if (!addresses || !addresses.length) {
            return res.status(400).json({ message: "At least one address required" });
        }

        const user = await userModel.findByIdAndUpdate(
            id,
            {
                $push: {
                    addresses: addresses
                }
            }, { new: true });

        if (!user) {
            return res.status(404).json({
                message: "user not found!"
            });
        }

        res.status(200).json({
            message: "Address created successfully",
            address: user.addresses
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }


}

async function deleteUserAddress(req, res) {
    try {
        const id = req.user._id;
        const addressId = req.params.addressesId;

        const user = await userModel.findByIdAndUpdate(
            id,
            {
                $pull: {
                    addresses: { _id: addressId }
                }
            }, { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "user not found!"
            });
        }

        res.status(200).json({
            message: "Address deleted successfully",
            address: user.addresses
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }



}

module.exports = {
    registerUser, loginUser, getUser, logoutUser, getUserAddress, addUserAddress, deleteUserAddress
}