const mongoose = require('mongoose');


async function connectedToDB(){
    await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('connected to DB');
    })
    .catch((err)=>{
        console.log('Error while connecting to db',err);
    });
}
module.exports = connectedToDB;