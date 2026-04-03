const mongoose = require('mongoose');


async function connectedToDb(){
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to DB");
    })
    .catch((err)=>{
        console.log('Error While connecting to mongodb',err);
    });
}

module.exports = connectedToDb;