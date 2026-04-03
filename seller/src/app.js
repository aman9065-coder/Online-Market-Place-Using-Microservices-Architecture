const cookieParser = require('cookie-parser');
const express = require('express');
const sellerRoutes = require('./routes/seller.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/seller',sellerRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"seller dashboard service is running..."
    });
});


module.exports = app;