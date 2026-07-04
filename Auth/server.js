require('dotenv').config();
const app = require('./src/app');
const connectedToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');



connectedToDB();
connect();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Auth service is listening on port ${PORT}`);
});