require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const axios = require('axios');
const paymentModel = require('../models/payment.models');
const Razorpay = require('razorpay');


jest.mock('axios');
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: "razorpay_order_123",
        amount: 12000,
        currency: "INR"
      })
    }
  }));
});

describe('POST /api/payment/create/:orderId', () => {
    let token;
    let userId;
    let orderId;

    beforeEach(() => {
        userId = new mongoose.Types.ObjectId(),
            orderId = new mongoose.Types.ObjectId();
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
            .post(`/api/payment/create/${orderId}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized No token");
    });
    it('should return 401 if token is invalid', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app)
            .post(`/api/payment/create/${orderId}`)
            .set('Authorization', `Bearer ${fakeToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized invalid token");
    });
    it('should return 201 if payment is created', async () => {
        axios.get.mockResolvedValue({
            data: {
                order: {
                    totalAmount: {
                        amount: 12000,
                        currency: "INR"
                    }
                }
            }
        });
       
        const res = await request(app).post(`/api/payment/create/${orderId}`).set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("payment initiated successfully!");
    });
    it('should return 500 if order service fails', async () => {
        axios.get.mockRejectedValue(new Error("Order service down"));

        const res = await request(app)
            .post(`/api/payment/create/${orderId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe("Internal server error!");
    });
});