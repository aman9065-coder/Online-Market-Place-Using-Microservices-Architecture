const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
require('dotenv').config();
const mongoose = require('mongoose');


jest.mock('../src/service/imagekit.service', () => {
    return jest.fn().mockResolvedValue({
        url: 'http://test-image.com/sample.jpg',
        thumbnail: 'http://test-image.com/thumb.jpg',
        id: 'mock_id_123'
    });
});

const sellerId = new mongoose.Types.ObjectId().toString();

describe('POST /api/products/', () => {
    it('it should create product and return 201 with product', async () => {

        const token = jwt.sign({ id: sellerId, role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);

        const res = await request(app)
            .post('/api/products/')
            .set(`Authorization`, `Bearer ${token}`)
            .field('title', 'test_title')
            .field('description', 'test_description')
            .field('priceAmount', 1233)
            .field('priceCurrency', 'INR')
            .field('category', 'Clothes')
            .attach('images', Buffer.from('dummy-image'), 'sample.jpg');

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe("product created successfully!");
        expect(res.body.data).toBeDefined();
        expect(res.body.data.title).toBe("test_title");
        expect(res.body.data.description).toBe("test_description");
        expect(res.body.data.price.amount).toBe(1233);
        expect(res.body.data.price.currency).toBe("INR");
        expect(res.body.data.category).toBe("Clothes");
        expect(res.body.data.seller).toBeDefined();
    })

    it('should return 403 if user is not a seller', async () => {
        const usertoken = jwt.sign({ id: 'secret123', role: 'user', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);

        const res = await request(app)
            .post('/api/products/')
            .set(`Authorization`, `Bearer ${usertoken}`)
            .field('title', 'test_title')
            .field('description', 'test_description')
            .field('priceAmount', 1233)
            .field('priceCurrency', 'INR')
            .field('category', 'Clothes')
            .attach('images', Buffer.from('dummy-image'), 'sample.jpg');

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Forbidden: insufficient permissions");
    });

    it('returns 401 when no auth cookie is provided', async () => {
        const res = await request(app).post('/api/products/')
            .field('title', 'test_title')
            .field('description', 'test_description')
            .field('priceAmount', 1233)
            .field('priceCurrency', 'INR')
            .field('category', 'Clothes')
            .attach('images', Buffer.from('dummy-image'), 'sample.jpg');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized No token");

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign(
            { id: "123", role: "seller" },
            "WRONG_SECRET"
        );

        const res = await request(app).post('/api/products/')
            .field('title', 'test_title')
            .field('description', 'test_description')
            .field('priceAmount', 1233)
            .field('priceCurrency', 'INR')
            .field('category', 'Clothes')
            .attach('images', Buffer.from('dummy-image'), 'sample.jpg')
            .set('cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized invalid token");
    });


});
