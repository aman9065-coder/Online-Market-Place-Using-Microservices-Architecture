require('dotenv').config();
const app = require('./src/app');
const connectedToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');


connectedToDB();

const listeners = require('./src/broker/listeners');

connect().then(() => {
    listeners();
});


const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`order service is listening on port ${PORT}`);
});