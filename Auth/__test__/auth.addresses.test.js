const request = require('supertest');
const userModel = require('../src/models/user.model');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


describe('GET user/me/addresses', () => {
    it('returns 200 and list of addresses when valid token cookie is present ', async () => {
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
            addresses: [{
                street: '123 Test Lane',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                zip: '400001'
            }]
        })

        const loginRes = await request(app).post('/api/auth/login').send({
            email: "test@example.com",
            password: "Secret123!"
        });

        const cookie = loginRes.headers['set-cookie'][0];

        const res = await request(app).get('/api/auth/user/me/addresses').set('Cookie', cookie);

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
        const res = await request(app).get('/api/auth/user/me/addresses');

        expect(res.statusCode).toBe(401);

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app).get('/api/auth/user/me/addresses').set('cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
    })

});

describe('POST user/me/addresses', () => {
    it('returns 200 and list of addresses when valid token cookie is present ', async () => {
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
        const res = await request(app).get('/api/auth/user/me/addresses');

        expect(res.statusCode).toBe(401);

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app).get('/api/auth/user/me/addresses').set('Cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
    })

});

describe('DELETE /user/me/addresses/:addressesId', () => {
    it('returns 200 and delete the list of addresses when valid token cookie is present ', async () => {
        const password = "Secret123!";
        const hash = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username: 'john_doe',
            email: "test@example.com",
            password: hash,
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            },
            role: 'user',
            addresses: [{
                street: '123 Test Lane',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                zip: '400001'
            }]
        });
        const addressId = user.addresses[0]._id.toString();
        const loginRes = await request(app).post('/api/auth/login').send({
            email: "test@example.com",
            password: "Secret123!"
        });

        const cookie = loginRes.headers['set-cookie'][0];

        const res = await request(app).delete(`/api/auth/user/me/addresses/${addressId}`).set('Cookie', cookie);
        expect(res.statusCode).toBe(200);
        expect(res.body.address).toBeDefined();
        expect(res.body.address.length).toBe(0);

    });

    it('returns 401 when no auth cookie is provided', async () => {
        const res = await request(app).get('/api/auth/user/me/addresses');

        expect(res.statusCode).toBe(401);

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app).get('/api/auth/user/me/addresses').set('Cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
    })
});