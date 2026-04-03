require('dotenv').config();
const app = require('./src/app');
const connectedToDb = require('./src/db/db');

connectedToDb();


app.listen('5002',()=>{
    console.log('cart service is running on port 5002');
    
});