const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/api/auth',authRoutes);

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"Auth service is running..."
    });
});


module.exports = app;

