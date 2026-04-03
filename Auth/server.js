require('dotenv').config();
const app = require('./src/app');
const connectedToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');



connectedToDB();
connect();

app.listen('5000',()=>{
    console.log('Auth service is listening on port 5000');
});