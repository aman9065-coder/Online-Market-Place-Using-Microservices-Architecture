const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/api/products',productRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"product service is running..."
    });
});

module.exports = app;