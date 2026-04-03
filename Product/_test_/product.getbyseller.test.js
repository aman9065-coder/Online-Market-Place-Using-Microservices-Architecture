const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const mongoose = require('mongoose');
const productModel = require('../src/models/product.model');

jest.mock('uuid', () => ({
    v4: () => 'test-uuid'
}));
jest.mock('../src/service/imagekit.service', () => {
    return jest.fn().mockResolvedValue({
        url: 'http://test-image.com/sample.jpg',
        thumbnail: 'http://test-image.com/thumb.jpg',
        id: 'mock_id_123'
    });
});

describe('GET /api/products/seller', () => {
    const sellerId = new mongoose.Types.ObjectId();

    it('returns 401 when no auth cookie is provided', async () => {
        const res = await request(app).get(`/api/products/seller`)
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized No token");

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign(
            { id: "123", role: "seller" },
            "WRONG_SECRET"
        );

        const res = await request(app).get(`/api/products/seller`)
            .set('cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized invalid token");
    });

    it('returns 200 with product when auth cookie is provided', async () => {
        const token = jwt.sign({ id: sellerId.toString(), role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);
        const product = await productModel.create({
            title: 'test_title',
            description: 'test_desc',
            price: {
                amount: 1000,
                currency: "INR"
            },
            seller: sellerId,
            images: [{
                url: 'http://test-image.com/sample.jpg',
                thumbnail: 'http://test-image.com/thumb.jpg',
                id: 'mock_id_123'
            }],
            category: 'Clothes'
        });
        const res = await request(app).get(`/api/products/seller`)
            .set(`Authorization`, `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].title).toBe('test_title');
    });
    it('returns empty array when seller has no products', async () => {
        const token = jwt.sign({ id: sellerId.toString(), role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);
        const res = await request(app).get(`/api/products/seller`)
            .set(`Authorization`, `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
    });
    it('applies skip and limit query params', async () => {
        const token = jwt.sign({ id: sellerId.toString(), role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);

        await productModel.insertMany([
            {
                title: 'p1',
                price: { amount: 120, currency: "INR" }, seller: sellerId, category: 'Electronics'
            },
            { title: 'p2', price: { amount: 120, currency: "INR" }, seller: sellerId, category: 'Electronics' },
            { title: 'p3', price: { amount: 120, currency: "INR" }, seller: sellerId, category: 'Electronics' }
        ]);

        const res = await request(app).get('/api/products/seller?skip=1&limit=1')
            .set(`Authorization`, `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
    });
    it('returns 403 when user is not seller', async () => {
        const token = jwt.sign({
            id: sellerId.toString(),
            username: "john_doe",
            email: "test@example.com",
            role: "user"
        },process.env.JWT_SECRET);

        const res = await request(app).get('/api/products/seller').
            set(`Authorization`, `Bearer ${token}`);

        expect(res.statusCode).toBe(403);

    });

});