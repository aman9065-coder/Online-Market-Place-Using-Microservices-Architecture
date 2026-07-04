const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
const { publishToQueue } = require("../broker/broker");

async function registerUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      fullname: { firstname, lastname },
      role,
    } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
      $or: [
        {
          username,
        },
        {
          email,
        },
      ],
    });

    if (isUserAlreadyExists) {
      return res
        .status(409)
        .json({ message: "username or email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      username,
      email,
      password: hash,
      fullname: { firstname, lastname },
      role,
    });

    await Promise.all([
      publishToQueue("AUTH_NOTIFICATION.USER_CREATED", {
        id: user._id,
        username: username,
        email: user.email,
        fullname: user.fullname,
      }),
      publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", user),
    ]);

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "user registered successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function loginUser(req, res) {
  try {
    const { username, email, password } = req.body;

    const user = await userModel
      .findOne({
        $or: [
          {
            username,
          },
          {
            email,
          },
        ],
      })
      .select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "invalid credentials : user not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "invalid credentials : password is invalid" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "user loggedin successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getUser(req, res) {
  return res.status(200).json({
    message: "current user fetched successfully!",
    user: req.user,
  });
}

async function logoutUser(req, res) {
  const token = req.cookies.token;
  try {
    if (token) {
      const decoded = jwt.decode(token);

      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          await redis.set(`blacklist_${token}`, `true`, `EX`, ttl);
        }
      }
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
    });

    res.status(200).json({
      message: "user logout successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
async function getUserAddress(req, res) {
  res.status(200).json({
    message: "Address fetched successfully",
    address: req.user.addresses,
  });
}

async function addUserAddress(req, res) {
  try {
    const id = req.user._id;

    const { addresses } = req.body;

    if (!addresses || addresses.length === 0) {
      return res.status(400).json({
        message: "At least one address required",
      });
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      {
        $push: {
          addresses: addresses,
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        message: "user not found!",
      });
    }

    res.status(200).json({
      message: "Address created successfully",
      address: user.addresses,
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
          addresses: { _id: addressId },
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        message: "user not found!",
      });
    }

    res.status(200).json({
      message: "Address deleted successfully",
      address: user.addresses,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
  getUserAddress,
  addUserAddress,
  deleteUserAddress,
};

// const userModel = require('../models/user.model');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const redis = require('../db/redis');
// const { publishToQueue } = require('../broker/broker');

// async function registerUser(req, res) {
//     try {
//         const { username, email, password, fullname: { firstname, lastname }, role } = req.body;

//         const isUserAlreadyExists = await userModel.findOne({
//             $or: [
//                 {
//                     username
//                 },
//                 {
//                     email
//                 }
//             ]
//         });

//         if (isUserAlreadyExists) {
//             return res.status(409).json({ message: "username or email already exists" });
//         }

//         const hash = await bcrypt.hash(password, 10);
//         const user = await userModel.create({
//             username, email, password: hash, fullname: { firstname, lastname }, role
//         });

//         // await Promise.all(
//         //     [
//         //         publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
//         //             id: user._id,
//         //             username: username,
//         //             email: user.email,
//         //             fullname: user.fullname
//         //         }),
//         //         publishToQueue('AUTH_SELLER_DASHBOARD.USER_CREATED', user)
//         //     ]
//         // );

//         const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

// //         🔹 Samjho properly (exam + practical)
// // ✅ httpOnly: true
// // Client-side JS (document.cookie) access nahi kar paayega
// // Security ke liye important (XSS attack se bachata hai)
// // ✅ secure: true
// // Cookie sirf HTTPS me send hogi
// // ⚠️ Localhost pe kabhi-kabhi issue deta hai → dev me false rakhte hain
// // ✅ maxAge
// // Milliseconds me hota hai
// // 24 * 60 * 60 * 1000 = 86400000 ms = 1 day

//         res.cookie('token', token, {
//             // only server side cokkies ko pdh payega client side nhi
//             httpOnly: true,
//             secure: true,
//             maxAge: 24 * 60 * 60 * 1000
//         });

//         res.status(201).json({
//             message: "user registered successfully!",
//             user: {
//                 id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 fullname: user.fullname,
//                 role: user.role,
//             }

//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }

// async function loginUser(req, res) {
//     try {
//         const { username, email, password } = req.body;

//         const user = await userModel.findOne({
//             $or: [
//                 {
//                     username
//                 },
//                 {
//                     email
//                 }
//             ]
//         }).select('+password');
//         if (!user) {
//             return res.status(401).json({ message: "invalid credentials" });
//         }

//         const isValidPassword = await bcrypt.compare(password, user.password);

//         if (!isValidPassword) {
//             return res.status(401).json({ message: "invalid credentials" });
//         }

//         const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: true,
//             maxAge: 24 * 60 * 60 * 1000
//         });

//         res.status(200).json({
//             message: "user loggedin successfully!",
//             user: {
//                 id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 fullname: user.fullname,
//                 role: user.role,
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }

// async function getUser(req, res) {
//     return res.status(200).json({
//         message: "current user fetched successfully!",
//         user: req.user

//     })
// }

// async function logoutUser(req, res) {
//     const token = req.cookies.token;

//     if (token) {
//         await redis.set(`blacklist_${token}`, `true`, `EX`, 24 * 60 * 60);
//     }

//     res.clearCookie('token', {
//         httpOnly: true,
//         secure: true
//     });

//     res.status(200).json({
//         message: "user logout successfully!"
//     });
// }

// async function getUserAddress(req, res) {
//     try {
//         const id = req.user._id;

//         const user = await userModel.findOne({
//             _id: id
//         });

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found!"
//             });
//         }

//         res.status(200).json({
//             message: "Address fetched successfully",
//             address: user.addresses,
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: error.message,
//         });
//     }
// }

// async function addUserAddress(req, res) {
//     try {
//         const id = req.user._id;

//         const { addresses } = req.body;

//         if (!addresses || !addresses.length) {
//             return res.status(400).json({ message: "At least one address required" });
//         }

//         const user = await userModel.findByIdAndUpdate(
//             id,
//             {
//                 $push: {
//                     addresses: addresses
//                 }
//             }, { new: true });

//         if (!user) {
//             return res.status(404).json({
//                 message: "user not found!"
//             });
//         }

//         res.status(200).json({
//             message: "Address created successfully",
//             address: user.addresses
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: error.message,
//         });
//     }

// }

// async function deleteUserAddress(req, res) {
//     try {
//         const id = req.user._id;
//         const addressId = req.params.addressesId;

//         const user = await userModel.findByIdAndUpdate(
//             id,
//             {
//                 $pull: {
//                     addresses: { _id: addressId }
//                 }
//             }, { new: true }
//         );

//         if (!user) {
//             return res.status(404).json({
//                 message: "user not found!"
//             });
//         }

//         res.status(200).json({
//             message: "Address deleted successfully",
//             address: user.addresses
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: error.message,
//         });
//     }

// }

// // async function deleteUserAddress(req, res) {
// //     try {
// //         const userId = req.user._id;
// //         const addressId = req.params.addressId;

// //         // User find karo pehle
// //         const user = await userModel.findById(userId);
// //         if (!user) {
// //             return res.status(404).json({ message: "User not found!" });
// //         }

// //         // Address exist karta hai ya nahi check karo
// //         const addressExists = user.addresses.some(
// //             addr => addr._id.toString() === addressId
// //         );
// //         if (!addressExists) {
// //             return res.status(404).json({ message: "Address not found!" });
// //         }

// //         // $pull lagao address remove karne ke liye
// //         const updatedUser = await userModel.findByIdAndUpdate(
// //             userId,
// //             { $pull: { addresses: { _id: addressId } } },
// //             { new: true }
// //         );

// //         res.status(200).json({
// //             message: "Address deleted successfully",
// //             addresses: updatedUser.addresses
// //         });

// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({
// //             message: "Something went wrong",
// //             error: error.message
// //         });
// //     }
// // }

// module.exports = {
//     registerUser, loginUser, getUser, logoutUser, getUserAddress, addUserAddress, deleteUserAddress
// }
