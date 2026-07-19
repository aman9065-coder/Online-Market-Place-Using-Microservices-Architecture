require('dotenv').config();
const app = require('./src/app');
const connectToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');

connectToDB();
connect();




const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`payment service is listening on port ${PORT}`);
});