const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');

const app = express();
app.use(express.json());
app.use(cors());

// jb react ya brower se requst krna ho

// app.use(cors({
//     origin: "http://localhost:5173"
// }));

app.use(cookieParser());

app.use('/api/products',productRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"product service is running..."
    });
});

module.exports = app;