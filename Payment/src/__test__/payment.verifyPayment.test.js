require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const {validatePaymentVerification} = require('razorpay/dist/utils/razorpay-utils');
const Razorpay = require('razorpay');
const paymentModel = require('../models/payment.models');

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


jest.mock('razorpay/dist/utils/razorpay-utils',()=>({
     validatePaymentVerification:jest.fn()
}));


describe('POST /api/payment/create/:orderId', () => {
    let token;
    let userId;
    let orderId;

    beforeEach(async () => {
        userId = new mongoose.Types.ObjectId(),
            orderId = new mongoose.Types.ObjectId();
        token = jwt.sign({
            id: userId,
            username: "john_doe",
            email: "test@example.com",
            role: "user"
        },
            process.env.JWT_SECRET);
        await paymentModel.create({
            order: orderId,
            user: userId,
            razorpayOrderId: "order_123",
            price: { amount: 1000, currency: "INR" },
            status: "PENDING"
        });

    });
    it('should return 401 if token is missing', async () => {
        const res = await request(app)
            .post(`/api/payment/verify`).send({
                paymentId: "123",
                signature: "abc",
                razorpayOrderId: "234"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized No token");
    });
    it('should return 401 if token is invalid', async () => {
        const fakeToken = jwt.sign({ id: "0000000000" }, 'wrong_secret');
        const res = await request(app)
            .post(`/api/payment/verify`).send({
                paymentId: "123",
                signature: "abc",
                razorpayOrderId: "234"
            })
            .set('Authorization', `Bearer ${fakeToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized invalid token");
    });
    it('should return 201 if payment is created', async () => {
        validatePaymentVerification.mockReturnValue(true);
        const res = await request(app).post(`/api/payment/verify`).send({
            paymentId: "pay_123",
            signature: "valid_signature",
            razorpayOrderId: "order_123"
        }).set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("payment verified successfully");
    });
     it('should return 400 if razorpay signature is invalid', async () => {
        validatePaymentVerification.mockReturnValue(false);
        const res = await request(app)
            .post('/api/payment/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({
                paymentId: "123",
                signature: "wrong_signature",
                razorpayOrderId: "order_123"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Invalid signature");
    });
     it('should return 404 if payment not found', async () => {
        validatePaymentVerification.mockReturnValue(true);
        const res = await request(app)
            .post('/api/payment/verify')
            .set('Authorization', `Bearer ${token}`)
            .send({
                paymentId: "123",
                signature: "valid_signature",
                razorpayOrderId: "order_234"
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe("payment not found");
    });

});