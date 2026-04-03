const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.get('/',(req,res)=>{
    res.status(200).json({
        message:"AI Buddy service is running..."
    });
});


module.exports = app;