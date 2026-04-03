const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const orderModel = require('../src/models/order.models');



describe('GET /api/orders/me', () => {
    let token;
    let userId;


    beforeEach(() => {
        userId = new mongoose.Types.ObjectId(),
            token = jwt.sign({
                id: userId,
                username: "john_doe",
                email: "test@example.com",
                role: "user"
            },
                process.env.JWT_SECRET);

    });


    it('should return empty array if user has no orders', async () => {
        const res = await request(app)
            .get('/api/orders/me')
            .set('Authorization', `Bearer ${token}`);


        expect(res.status).toBe(200);
        expect(res.body.orders).toEqual([]);
        expect(res.body.meta.total).toBe(0);
    });

    it('should return 401 if token is missing', async () => {
        const res = await request(app)
            .get('/api/orders/me')
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Unauthorized No token');
    });
    it('should return 401 if token is invalid', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');

        const res = await request(app)
            .get('/api/orders/me')
            .set(`Authorization`, `Bearer ${fakeToken}`)

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Unauthorized invalid token');
    });

    it('should return paginated orders', async () => {
        for (let i = 1; i <= 5; i++) {
            await orderModel.create({
                user: userId,
                items: [{ product:new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: 'INR' } }],
                totalAmount: { amount: 100, currency: 'INR' },
                status: 'PENDING',
                shippingAddress: { street: 'A', city: 'B', state: 'C', country: 'IN', zip: '123456' }
            })
        }
        const res = await request(app)
            .get('/api/orders/me?page=1&limit=2')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.orders.length).toBe(2);
        expect(res.body.meta.total).toBe(5);
        expect(res.body.meta.totalPages).toBe(3);
        expect(res.body.meta.hasNextPage).toBe(true);
        expect(res.body.meta.hasPrevPage).toBe(false);
    });
     it('should return 2nd page correctly', async () => {
    for (let i = 1; i <= 5; i++) {
      await orderModel.create({
        user: userId,
        items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: 'INR' } }],
        totalAmount: { amount: 100, currency: 'INR' },
        status: 'PENDING',
        shippingAddress: { street: 'A', city: 'B', state: 'C', country: 'IN', zip: '123456' }
      });
    }

    const res = await request(app)
      .get('/api/orders/me?page=2&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.orders.length).toBe(2);
    expect(res.body.meta.page).toBe(2);
    expect(res.body.meta.hasNextPage).toBe(true);
    expect(res.body.meta.hasPrevPage).toBe(true);
    });
    it('should default to page=1 and limit=10 for invalid query params', async () => {
     await orderModel.create({
    user: userId,
    items: [{ product: new mongoose.Types.ObjectId(), quantity: 1, price: { amount: 100, currency: 'INR' } }],
    totalAmount: { amount: 100, currency: 'INR' },
    status: 'PENDING',
    shippingAddress: { street: 'A', city: 'B', state: 'C', country: 'IN', zip: '123456' }
     });

  const res = await request(app)
    .get('/api/orders/me?page=abc&limit=xyz')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.meta.page).toBe(1);
  expect(res.body.meta.limit).toBe(10);
    });

});