const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




describe('POST /api/auth/login', () => {
    it('log in with correct credentials and return 200 with user (no password) and sets cookie', async () => {
        const password = "Secret123!";
        const hash = await bcrypt.hash(password,10);
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
        const res = await request(app).post('/api/auth/login').send({
            username: "john_doe",
            password: "Secret123!"
        });

        
        expect(res.statusCode).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('john_doe');
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.user.password).toBeUndefined();

        const setcookie = res.headers['set-cookie'];
        expect(setcookie).toBeDefined();
        expect(setcookie.join(';')).toMatch(/token/);


    });

    it('rejects wrong password with 401',async()=>{
         const password = "Secret123!";
        const hash = await bcrypt.hash(password,10);
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
        const res = await request(app).post('/api/auth/login').send({
            username: "john_doe",
            email: "test@example.com",
            password: "wrongPassword!"
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('invalid credentials');
    });

    it('validates missing fields with 400', async () => {
        const incompleteData = {
            username: 'john_doe',
            email:'test@example.com',
        }
        const res = await request(app).post('/api/auth/register').send(incompleteData);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
});

