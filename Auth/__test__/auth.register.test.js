const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


describe('POST /api/auth/register', () => {
    it('create a user and return 201 with user (no password)', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'john_doe',
            email: "test@example.com",
            password: "Secret123!",
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            },
            role:'user'
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toBe('john_doe');
        expect(res.body.user.email).toBe('test@example.com');
        expect(res.body.user.password).toBeUndefined();
        expect(res.body.user.fullname.firstname).toBe('John');
        expect(res.body.user.fullname.lastname).toBe('Doe');
        expect(res.body.user.role).toBe('user');
    });

    it('rejects duplicate username/email with 409', async () => {
        const userData = {
            username: 'john_doe',
            email: "test@example.com",
            password: "Secret123!",
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            },
            addresses: [{
                street: '123 Test Lane', city: 'Mumbai',
                state: 'Maharashtra', country: 'India', zip: '400001'
            }]
        }
        await request(app).post('/api/auth/register').send(userData);
        const res = await request(app).post('/api/auth/register').send(userData);

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('message');

    });

    it('validates missing fields with 400', async () => {
        const incompleteData = {
            username: 'john_doe',
            fullname: {
                firstname: "John",
                lastname: 'Doe'
            }
        }
        const res = await request(app).post('/api/auth/register').send(incompleteData);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

});