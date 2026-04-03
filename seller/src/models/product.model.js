const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    price:{
        amount:{
            type:Number,
            required:true
        },
        currency:{
            type:String,
            enum:["USD","INR"],
            default:"INR"
        }
    },
    images:[{
        url:String,
        thumbnail:String,
        id:String
    }],
    category:{
        type:String,
        required:true
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    stock:{
        type:Number,
        default:0
    }
}, { timestamps: true });

productSchema.index({title:'text',description:'text'});

const productModel = mongoose.model('product',productSchema);

module.exports = productModel;