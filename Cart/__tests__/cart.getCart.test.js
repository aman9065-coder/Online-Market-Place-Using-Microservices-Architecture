const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const cartModel = require('../src/models/cart.models');


describe('GET /api/cart/items', () => {
    let userId;
    let token;
    let productId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        token = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'user'
        }, process.env.JWT_SECRET);

        productId = new mongoose.Types.ObjectId();

        await cartModel.create({
            user:userId,
            items:[{
                productId:productId,
                quantity:2
            }]
        });

    })
    it('returns 200 and fetched cart', async () => {
        const res = await request(app).get('/api/cart/items').set(`Authorization`, `Bearer ${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[0].quantity).toBe(2);
    });
    it('returns 401 when no auth is provided', async () => {
        const res = await request(app).get('/api/cart/items');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , no token');
    });
    it('returns 401 when invalid token is provided', async () => {
        const faketoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'user'
        }, 'wrong_secret');
        const res = await request(app).get('/api/cart/items').set(`Authorization`, `Bearer ${faketoken}`)

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , invalid token');
    });
    it('returns 403 when role is not user', async () => {
        const admintoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'admin'
        }, process.env.JWT_SECRET);

        const res = await request(app).get('/api/cart/items').set(`Authorization`, `Bearer ${admintoken}`)

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Forbidden: insufficient permissions');
    });
    it('creates an empty cart if cart does not exist', async () => {
    await cartModel.deleteMany({});

    const res = await request(app)
        .get('/api/cart/items')
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
    expect(res.body.totals.itemQuantity).toBe(0);
    expect(res.body.totals.totalQuantity).toBe(0);
    });
    it('returns correct totals', async () => {
    const res = await request(app)
        .get('/api/cart/items')
        .set('Authorization', `Bearer ${token}`);

    expect(res.body.totals.itemQuantity).toBe(1);
     expect(res.body.totals.totalQuantity).toBe(2);
    });
    it('calculates totals for multiple items', async () => {
    await cartModel.updateOne(
        { user: userId },
        {
            $push: {
                items: { productId: new mongoose.Types.ObjectId(), quantity: 3 }
            }
        }
    );

    const res = await request(app)
        .get('/api/cart/items')
        .set('Authorization', `Bearer ${token}`);

    expect(res.body.totals.itemQuantity).toBe(2);
    expect(res.body.totals.totalQuantity).toBe(5);
    });






  

});