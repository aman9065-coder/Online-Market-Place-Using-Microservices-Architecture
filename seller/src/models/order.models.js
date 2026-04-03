const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({

    street: String,
    city: String,
    state: String,
    country: String,
    zip: String

});
const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },

    items: [
        {
            product: {
                type: mongoose.Types.ObjectId,
                required: true
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
            price: {
                amount: {
                    type: Number,
                    required: true
                },
                currency: {
                    type: String,
                    enum: ["USD", "INR"],
                    default: "INR"
                }
            },
        }


    ],
    totalAmount: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ["USD", "INR"],
            default: "INR"
        }
    },
    status:{
        type:String,
        enum:["PENDING","CONFIRMED","DELIEVERED","CANCELLED","COMPLETED","SHIPPED"],
        default:"PENDING"
    },
    shippingAddress: {
        type:addressSchema,
        required:true
    }
}, { timestamps: true }
);

const orderModel = mongoose.model('order', orderSchema);

module.exports = orderModel;