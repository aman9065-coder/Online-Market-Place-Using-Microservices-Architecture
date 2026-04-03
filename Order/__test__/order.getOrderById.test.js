const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const orderModel = require('../src/models/order.models');

describe('GET /api/orders/:id', () => {
    let token;
    let userId;
    let orderId;


    beforeEach(() => {
        orderId = new mongoose.Types.ObjectId(),
            userId = new mongoose.Types.ObjectId(),
            token = jwt.sign({
                id: userId,
                username: "john_doe",
                email: "test@example.com",
                role: "user"
            },
                process.env.JWT_SECRET);

    });


    it('should return 401 if token is missing', async () => {
        const res = await request(app)
            .get(`/api/orders/${orderId}`)
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Unauthorized No token');
    });
    it('should return 401 if token is invalid', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');

        const res = await request(app)
            .get(`/api/orders/${orderId}`)
            .set(`Authorization`, `Bearer ${fakeToken}`)

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Unauthorized invalid token');
    });
    it('should return 403 if role is not a user', async () => {
        const fakeToken = jwt.sign({
            id: userId,
            username: "john_doe",
            email: "test@example.com",
            role: "seller"
        },
            process.env.JWT_SECRET);

        const res = await request(app)
            .get(`/api/orders/${orderId}`)
            .set(`Authorization`, `Bearer ${fakeToken}`)

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden: insufficient permissions");
    });
    it('should return 200 with order', async () => {

        const order = await orderModel.create({
            user: userId,
            items: [
                {
                    product: new mongoose.Types.ObjectId(),
                    quantity: 2,
                    price: {
                        amount: 500,
                        currency: "INR"
                    }
                },

            ],
            totalAmount: {
                amount: 500,
                currency: "INR"
            },
            status: "PENDING",
            shippingAddress: {
                street: "123",
                city: "patna",
                state: "bihar",
                country: "india",
                zip: "842001"
            }
        });

        const res = await request(app)
            .get(`/api/orders/${order._id}`)
            .set(`Authorization`, `Bearer ${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.order._id.toString()).toBe(order._id.toString());
    });
    it('should return 404 if order is not found', async () => {
        const res = await request(app)
            .get(`/api/orders/${orderId}`)
            .set(`Authorization`, `Bearer ${token}`)

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("order not found!");
    });
    it('should return 500 for invalid orderId format', async () => {
        const res = await request(app)
            .get('/api/orders/123')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
    });
    it('should return 403 if order belongs to another user', async () => {
        const otherUserId = new mongoose.Types.ObjectId();

        const order = await orderModel.create({
            user: otherUserId,
            items: [{
                product: new mongoose.Types.ObjectId(),
                quantity: 1,
                price: { amount: 100, currency: "INR" }
            }],
            totalAmount: { amount: 100, currency: "INR" },
            status: "PENDING",
            shippingAddress: {
                street: "A", city: "B", state: "C", country: "IN", zip: "123456"
            }
        });

        const res = await request(app)
            .get(`/api/orders/${order._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden:you don't have access");
    });
});