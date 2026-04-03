const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    street: String,
    city: String,
    state: String,
    country: String,
    zip: String

})
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select:false
    },
    fullname: {
        firstname: {
            type: String,
            required: true,
        },
        lastname: {
            type: String,
            required: true
        }
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "seller","admin"]
    },
    addresses: [
      addressSchema
    ]
});

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;