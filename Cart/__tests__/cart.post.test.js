const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');



describe('POST /api/cart/items', () => {
    let userId;
    let token;
    let productId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId();
        token = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'user'
        }, process.env.JWT_SECRET);

        productId = new mongoose.Types.ObjectId();

    })
    it('returns 200 and adds item to the cart', async () => {
        const res = await request(app).post('/api/cart/items').set(`Authorization`, `Bearer ${token}`)
            .send({ productId:productId.toString(), quantity: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[0].productId.toString())
            .toBe(productId.toString());
    });
    it('returns 401 when no auth is provided', async () => {
        const res = await request(app).post('/api/cart/items')
            .send({ productId: productId, quantity: 1 });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , no token');
    });
    it('returns 401 when invalid token is provided', async () => {
        const faketoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'user'
        }, 'wrong_secret');
        const res = await request(app).post('/api/cart/items').set(`Authorization`, `Bearer ${faketoken}`)
            .send({ productId: productId, quantity: 1 });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , invalid token');
    });
    it('returns 403 when role is not user', async () => {
        const admintoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'admin'
        }, process.env.JWT_SECRET);

        const res = await request(app).post('/api/cart/items').set(`Authorization`, `Bearer ${admintoken}`)
            .send({ productId:productId, quantity: 1 });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Forbidden: insufficient permissions');
    });
    it('increments quantity when same product is added again', async () => {
        await request(app).post('/api/cart/items')
            .set(`Authorization`, `Bearer ${token}`)
            .send({ productId: productId, quantity: 1 });

        const res = await request(app).post('/api/cart/items')
            .set(`Authorization`, `Bearer ${token}`)
            .send({ productId: productId, quantity: 3 });


        expect(res.statusCode).toBe(200);
        expect(res.body.cart.items).toHaveLength(1);
        expect(res.body.cart.items[0].quantity).toBe(4);
    });
    it('adds multiple different products to the cart',async()=>{
      const productId1 = new mongoose.Types.ObjectId();
       
       await request(app).post('/api/cart/items')
            .set(`Authorization`, `Bearer ${token}`)
            .send({ productId: productId, quantity: 1 });

        const res = await request(app).post('/api/cart/items')
            .set(`Authorization`, `Bearer ${token}`)
            .send({ productId: productId1, quantity: 3 });

        expect(res.statusCode).toBe(200);
        expect(res.body.cart.items).toHaveLength(2);

    });
    it('returns 400 when productId is missing', async () => {
    const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 1 });

    expect(res.statusCode).toBe(400);
    });
    it('returns 400 when quantity is zero or negative', async () => {
    const res = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productId, quantity: 0 });

    expect(res.statusCode).toBe(400);
    });
    it('creates separate carts for different users',async()=>{
        const anotherUserId = new mongoose.Types.ObjectId();
       const anotherusertoken = jwt.sign({
            id: anotherUserId, username: "john_doe", email: "test@example.com", role: 'user'
        }, process.env.JWT_SECRET);

         const res1 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: productId, quantity: 1 });

         const res2 = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${anotherusertoken}`)
        .send({ productId: productId, quantity: 1 });

        expect(res1.statusCode).toBe(200);
        expect(res2.statusCode).toBe(200);
        expect(res1.body.cart.user.toString()).not.toBe(res2.body.cart.user.toString());
    });

});