const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const cartModel = require('../src/models/cart.models');



describe('DELETE /api/cart/items/:productId', () => {
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
            items:[
                {
                    productId:productId,
                    quantity:2
                }
            ]
        })

    })
    it('returns 200 and delete item from the cart', async () => {
        const res = await request(app).delete(`/api/cart/items/${productId}`).set(`Authorization`, `Bearer ${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.cart.items).toHaveLength(0);
    });
    it('returns 401 when no auth is provided', async () => {
        const res = await request(app).delete(`/api/cart/items/${productId}`)

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , no token');
    });
    it('returns 401 when invalid token is provided', async () => {
        const faketoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'user'
        }, 'wrong_secret');
        const res = await request(app).delete(`/api/cart/items/${productId}`).set(`Authorization`, `Bearer ${faketoken}`)

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('unauthorized , invalid token');
    });
    it('returns 403 when role is not user', async () => {
        const admintoken = jwt.sign({
            id: userId, username: "john_doe", email: "test@example.com", role: 'admin'
        }, process.env.JWT_SECRET);

        const res = await request(app).delete(`/api/cart/items/${productId}`).set(`Authorization`, `Bearer ${admintoken}`)

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('Forbidden: insufficient permissions');
    });
    it('returns 404 when item is not found in the cart', async () => {
    const fakeProductId = new mongoose.Types.ObjectId();
    const res = await request(app)
        .delete(`/api/cart/items/${fakeProductId}`)
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('items not found');
    });
    it('returns 404 when cart does not exist', async () => {
    await cartModel.deleteMany({ user: userId }); // remove user's cart

    const res = await request(app)
        .delete(`/api/cart/items/${productId}`)
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('cart not found');
    });
   it('returns 400 if productId is not a valid ObjectId', async () => {
    const res = await request(app)
        .delete(`/api/cart/items/invalid-id`)
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid productId');
   });
});