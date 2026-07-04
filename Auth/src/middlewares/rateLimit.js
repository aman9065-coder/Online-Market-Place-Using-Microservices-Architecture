const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({
    windowMs:15*60*1000,
    max:5,
    message:{
        success:false,
         message: 'Too many login attempts. Try again later.'
    }
});

const registerLimiter = rateLimit({
    windowMs:15*60*1000,
    max:5,
    message:{
        success:false,
         message: 'Too many register attempts. Try again later.'
    }
});

module.exports = {
    loginLimiter,registerLimiter
}