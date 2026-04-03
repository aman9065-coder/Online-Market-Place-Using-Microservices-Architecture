const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');

let redis;

if (process.env.NODE_ENV === 'test') {
    // Agar environment 'test' hai toh fake redis use karo
    redis = new RedisMock();
    console.log("Using Mock Redis for Testing");
} else {
    // Production ya Development ke liye asli redis
    redis = new Redis({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    });
}

redis.on('connect', () => {
    console.log("Connected to Redis");
});

module.exports = redis;