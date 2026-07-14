const {MongoMemoryServer} =  require('mongodb-memory-server');
const mongoose = require('mongoose');
const connectedToDb = require('../src/db/db');


let  mongo;
beforeAll(async()=>{
     mongo = await MongoMemoryServer.create();
     const uri = mongo.getUri();
     process.env.MONGO_URI = uri;
     process.env.JWT_SECRET = 'test_jwt_secret';
     await connectedToDb();  
});

afterEach(async()=>{
    const collections = await mongoose.connection.db.collections();

    for(let collection of collections){
        await collection.deleteMany({});
    }
});
afterAll(async()=>{
     await mongoose.disconnect();
    if(mongo) await mongo.stop(); 
});