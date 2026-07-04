const request = require('supertest');
const app = require('../src/app');
const userModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../src/db/redis');


describe('GET /api/auth/logout', () => {
    it("clears cookies and returns 200 when logged out", async () => {
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
        });
        const loginRes = await request(app).post('/api/auth/login').send({
            username: "john_doe",
            password: "Secret123!"
        });
        expect(loginRes.statusCode).toBe(200);
        const cookies = loginRes.headers['set-cookie'];
        expect(cookies).toBeDefined();

        const res = await request(app).get('/api/auth/logout').set('Cookie', cookies);

        expect(res.statusCode).toBe(200);
        const token = cookies[0].split(';')[0].split('=')[1];

        const redisValue = await redis.get(`blacklist_${token}`);
        expect(redisValue).toBe('true');
        const setCookie = res.headers['set-cookie'];
        const cookieStr = setCookie.join(';');
        expect(cookieStr).toMatch(/token=;/);
        expect(cookieStr.toLowerCase()).toMatch(/expires=/);

    });

    //   Agar user already logout hai
    // Aur fir logout API call kare
    // To server crash na kare
    // Error na de
    //     Idempotent matlab:

    // Ek hi operation baar-baar karo
    // Final result same rahe
    it('is idempotent: returns 200 even without auth cookie', async () => {
        const res = await request(app).get('/api/auth/logout');
        expect(res.statusCode).toBe(200);
    });
});

// Internally kya hota hai?

// Express khud response header bhejta hai.

// Kuch aisa:

// Set-Cookie:
// token=;
// Expires=Thu, 01 Jan 1970 00:00:00 GMT

// Dhyan do 👀

// Tumne code me:

// expires: new Date(0)

// nahi likha.

// Lekin:

// res.clearCookie()

// Express internally ye kaam kar deta hai.

// Isi wajah se tumhara test pass ho raha hai.