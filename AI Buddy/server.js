require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const {initSocketServer} = require('./src/sockets/socket');

const httpServer = http.createServer(app);

initSocketServer(httpServer);

httpServer.listen('5005',()=>{
    console.log('Ai-Buddy service is running on port 5005');
});

