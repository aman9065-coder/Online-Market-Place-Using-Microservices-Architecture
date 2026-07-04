const {MongoMemoryServer} = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connectedToDB = require('../src/db/db');
const redis = require('../src/db/redis');
require('dotenv').config();


let mongoServer;

beforeAll(async()=>{
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    await connectedToDB();
});

afterEach(async()=>{ 
    const collections = await mongoose.connection.db.collections();

    for(let collection of collections){
        await collection.deleteMany({});
    }
     await redis.flushall();
});

afterAll(async()=>{
    await mongoose.disconnect();
    await mongoServer.stop();
    await redis.quit();
});

//  Pure Flow ko Ek Example se Samjho:
// beforeAll: Server Start hua (DB Khali hai).

// Test 1: Tumne user "A" save kiya ⮕ Test khatam.

// afterEach: DB se "A" ko delete kar diya (DB fir se Khali).

// Test 2: Tumne user "B" save kiya ⮕ Test khatam.

// afterEach: DB se "B" ko delete kar diya (DB fir se Khali).

// afterAll: Server hi band kar diya.


