const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const orderModel = require('../src/models/order.models');


describe('GET /api/orders/:id/cancel', () => {
    let token;
    let userId;
    let orderId;

    beforeEach(() => {
        userId = new mongoose.Types.ObjectId(),
            token = jwt.sign({
                id: userId,
                username: "john_doe",
                email: "test@example.com",
                role: "user"
            },
                process.env.JWT_SECRET);
        orderId = new mongoose.Types.ObjectId();

    });

    it('should return 401 if token is missing', async () => {
        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Unauthorized No token');
    });
    it('should return 401 if token is invalid', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set(`Authorization`, `Bearer ${fakeToken}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


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
            .patch(`/api/orders/${orderId}/address`)
            .set(`Authorization`, `Bearer ${fakeToken}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden: insufficient permissions");
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
            .patch(`/api/orders/${order._id}/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden:you don't have access to this order");
    });
    it('should return 404 if order is not found', async () => {
        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set(`Authorization`, `Bearer ${token}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("order not found!");
    });
    it('should return 400 for invalid orderId format', async () => {
        const res = await request(app)
            .patch(`/api/orders/123/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("invalid order id");
    });
    it('should return 200 and update the address', async () => {
        const order = await orderModel.create({
            user: userId,
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
            .patch(`/api/orders/${order._id}/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.order.shippingAddress.city).toBe("2");
        expect(res.body.order.shippingAddress.country).toBe("USA");

    });
    it('should return 409 if order status is not pending', async () => {
        const order = await orderModel.create({
            user: userId,
            items: [{
                product: new mongoose.Types.ObjectId(),
                quantity: 1,
                price: { amount: 100, currency: "INR" }
            }],
            totalAmount: { amount: 100, currency: "INR" },
            status: "SHIPPED",
            shippingAddress: {
                street: "A", city: "B", state: "C", country: "IN", zip: "123456"
            }
        });
        const res = await request(app)
            .patch(`/api/orders/${order._id}/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                shippingAddress: {
                    street: "1", city: "2", state: "3", country: "USA", zip: "842002"
                }
            });


        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe("order cannot be updated at this status");
    });
    it('should return 400 if shippingAddress is completely missing', async () => {
        const order = await orderModel.create({
            user: userId,
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
            .patch(`/api/orders/${order._id}/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.statusCode).toBe(400);
    });
    it('should return 400 if shippingAddress fields are incomplete', async () => {
        const order = await orderModel.create({
            user: userId,
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
            .patch(`/api/orders/${order._id}/address`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                shippingAddress: { street: "A" }
            });

        expect(res.statusCode).toBe(400);
    });


});