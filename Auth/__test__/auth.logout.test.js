const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


describe('GET /api/auth/logout',()=>{
  it("clears cookies and returns 200 when logged out",async()=>{
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
        const loginRes = await request(app).post('/api/auth/login').send({
            username: "john_doe",
            password: "Secret123!"
        });
        expect(loginRes.statusCode).toBe(200);
        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const res = await request(app).get('/api/auth/logout').set('Cookie',cookies);

        expect(res.statusCode).toBe(200);
        const setCookie = res.headers['set-cookie'];
        const cookieStr = setCookie.join(';');
        expect(cookieStr).toMatch(/token=;/);
        expect(cookieStr.toLowerCase()).toMatch(/expires=/);
      
  });
  it('is idempotent: returns 200 even without auth cookie',async()=>{
    const res = await request(app).get('/api/auth/logout');
    expect(res.statusCode).toBe(200);
  });
});