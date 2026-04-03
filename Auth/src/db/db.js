const mongoose = require('mongoose');

async function connectedToDB(){
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to DB");
    })
    .catch((err)=>{
        console.log('Error while connecting to db');
    });
}

module.exports = connectedToDB;