const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cartRoutes = require('../src/routes/cart.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/cart',cartRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"cart service is running..."
    });
});


module.exports = app;