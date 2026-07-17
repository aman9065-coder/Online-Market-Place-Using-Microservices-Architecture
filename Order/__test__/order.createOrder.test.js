const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const axios = require('axios');
const orderModel = require('../src/models/order.models');

process.env.NODE_ENV = 'test';




jest.mock('axios');

describe('POST /api/orders', () => {
  let token;
  let userId;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    token = jwt.sign(
      {
        id: userId,
        username: 'john_doe',
        email: 'test@example.com',
        role: 'user'
      },
      process.env.JWT_SECRET
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create order and return 201', async () => {
    
    // Valid ObjectId banao
    const productId = new mongoose.Types.ObjectId();

    axios.get
      .mockResolvedValueOnce({
        data: {
          cart: {
            items: [{ productId: productId.toString(), quantity: 2 }] // ✅
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: productId.toString(), // ✅ Same ID
            title: 'Test Product',
            stock: 10,
            price: { amount: 100, currency: 'INR' },
            category: 'test_category'
          }
        }
      });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'test_street',
          city: 'test_city',
          state: 'test_state',
          country: 'test_country',
          zip: '840001'
        }
      });

    const count = await orderModel.countDocuments();

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(count).toBe(1);
});

  it('should return 400 if cart service fails', async () => {
    axios.get.mockRejectedValue(new Error('cart service down'));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'A',
          city: 'B',
          state: 'C',
          country: 'IN',
          zip: '840001'
        }
      });

    const count = await orderModel.countDocuments();

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('cart service down');
    expect(count).toBe(0);
  });

  it('should return 400 if product service fails', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          cart: { items: [{ productId: 'p1', quantity: 1 }] }
        }
      })
      .mockRejectedValueOnce(new Error('Product service error'));

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'A',
          city: 'B',
          state: 'C',
          country: 'IN',
          zip: '840001'
        }
      });

    const count = await orderModel.countDocuments();

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Product service error');
    expect(count).toBe(0);
  });

  it('should return 400 if product stock is insufficient', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          cart: {
            items: [{ productId: 'product123', quantity: 12 }]
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: 'product123',
            title: 'Test Product',
            stock: 10,
            price: { amount: 100, currency: 'INR' },
            category: 'test_category'
          }
        }
      });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'test_street',
          city: 'test_city',
          state: 'test_state',
          country: 'test_country',
          zip: '840001'
        }
      });

    const count = await orderModel.countDocuments();

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('out of stock');
    expect(count).toBe(0);
  });

  it('should not create order if cart is empty', async () => {
    axios.get.mockResolvedValueOnce({
      data: { cart: { items: [] } }
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'A',
          city: 'B',
          state: 'C',
          country: 'IN',
          zip: '840001'
        }
      });

    const count = await orderModel.countDocuments();

    expect(count).toBe(0);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Cart is empty');
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app).post('/api/orders').send({
      shippingAddress: {
        street: 'A',
        city: 'B',
        state: 'C',
        country: 'IN',
        zip: '840001'
      }
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized No token');
  });

  it('should return 401 if token is invalid', async () => {
    const fakeToken = jwt.sign({ id: '0000000000' }, 'wrong_secret');

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({
        shippingAddress: {
          street: 'A',
          city: 'B',
          state: 'C',
          country: 'IN',
          zip: '840001'
        }
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Unauthorized invalid token');
  });
  it('should return 403 if user does not have permission', async () => {
  // seller role ka token bana rahe hain
  const sellerToken = jwt.sign(
    {
      id: new mongoose.Types.ObjectId(),
      username: 'seller_user',
      email: 'seller@example.com',
      role: 'seller' // user nahi hai
    },
    process.env.JWT_SECRET
  );

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      shippingAddress: {
        street: 'A',
        city: 'B',
        state: 'C',
        country: 'IN',
        zip: '840001'
      }
    });

  expect(res.statusCode).toBe(403);
  expect(res.body.message).toBe('Forbidden: insufficient permissions');

  });  

  it('should return 400 if shipping address is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 if zip code is invalid', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shippingAddress: {
          street: 'A',
          city: 'B',
          state: 'C',
          country: 'IN',
          zip: 'INVALID'
        }
      });

    expect(res.statusCode).toBe(400);
  });

 
});