const { MongoMemoryServer } = require('mongodb-memory-server');
const connectedToDB = require('../src/db/db');
const mongoose = require('mongoose');

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    const mongoUri = mongo.getUri();

    process.env.MONGO_URI = mongoUri;
    process.env.JWT_SECRET = 'jwt_secret';

    await connectedToDB();
});

afterEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections) {
        await collection.deleteMany({});
    }
});
afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
});