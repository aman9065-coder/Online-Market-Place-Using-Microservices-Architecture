const request = require('supertest');
const userModel = require('../src/models/user.model');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('../src/db/redis');


describe('POST user/me/addresses', () => {
    it('returns 200 and list of addresses when valid token cookie is present', async () => {
        const password = "Secret123!";
        const hash = await bcrypt.hash(password, 10);
        await userModel.create({
            username: 'john_doe',
            email: "test@example.com",
            password: hash,
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            },
            role: 'user'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email: "test@example.com",
            password: "Secret123!"
        });

        const cookie = loginRes.headers['set-cookie'][0];

        const res = await request(app).post('/api/auth/user/me/addresses').set('Cookie', cookie).send(
            {
                addresses: [{
                    street: '123 Test Lane',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    country: 'India',
                    zip: '400001'
                }]
            }
        );
        expect(res.statusCode).toBe(200);
        expect(res.body.address).toBeDefined();
        expect(res.body.address.length).toBeGreaterThan(0);

        const address = res.body.address[0];
        expect(address.street).toBe('123 Test Lane');
        expect(address.city).toBe('Mumbai');
        expect(address.state).toBe('Maharashtra');
        expect(address.country).toBe('India');
        expect(address.zip).toBe('400001');
    });

    it('returns 401 when no auth cookie is provided', async () => {
        const res = await request(app).post('/api/auth/user/me/addresses');

        expect(res.statusCode).toBe(401);

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app).post('/api/auth/user/me/addresses').set('Cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
    })
    it('returns 400 when addresses are missing', async () => {


        const password = "Secret123!";
        const hash = await bcrypt.hash(password, 10);

        await userModel.create({
            username: 'john_doe',
            email: "test@example.com",
            password: hash,
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            }
        });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: "test@example.com",
                password: "Secret123!"
            });

        const cookie = loginRes.headers['set-cookie'][0];

        const res = await request(app)
            .post('/api/auth/user/me/addresses')
            .set('Cookie', cookie)
            .send({}); //  empty body

        expect(res.statusCode).toBe(400);
    });
    it('returns 401 when token is blacklisted', async () => {

        const password = "Secret123!";
        const hash = await bcrypt.hash(password, 10);

        await userModel.create({
            username: 'john_doe',
            email: "test@example.com",
            password: hash,
            fullname: {
                firstname: 'John',
                lastname: 'Doe'
            }
        });

        // login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: "test@example.com",
                password: "Secret123!"
            });

        const cookie = loginRes.headers['set-cookie'][0];

        // extract token
        const token = cookie.split(';')[0].split('=')[1];

        // blacklist it manually
        await redis.set(`blacklist_${token}`, 'true', 'EX', 3600);

        // try API call
        const res = await request(app)
            .post('/api/auth/user/me/addresses')
            .set('Cookie', cookie)
            .send({
                addresses: [{
                    street: '123 Test',
                    city: 'Mumbai',
                    state: 'MH',
                    country: 'India',
                    zip: '400001'
                }]
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Token has been blacklisted');
    });
 
    it('returns 404 when user no longer exists in DB', async () => {
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username: 'john_doe',
        email: "test@example.com",
        password: hash,
        fullname: {
            firstname: "John",
            lastname: 'Doe'
        }
    });

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
            email: "test@example.com",
            password: "Secret123!"
        });

    const cookie = loginRes.headers['set-cookie'][0];

    // Login ke baad user ko DB se delete kar do,
    // lekin token abhi bhi valid rahega (JWT stateless hota hai)
    await userModel.findByIdAndDelete(user._id);

    const res = await request(app)
        .post('/api/auth/user/me/addresses')
        .set('Cookie', cookie)
        .send({
            addresses: [{
                street: '789 Ghost Street',
                city: 'Delhi',
                state: 'Delhi',
                country: 'India',
                zip: '110001'
            }]
        });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('user not found!');
   });

});