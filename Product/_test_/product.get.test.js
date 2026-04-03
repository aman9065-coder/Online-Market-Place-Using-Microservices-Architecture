const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const productModel = require('../src/models/product.model');
const { mongoose } = require('mongoose');

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

describe('GET /api/products/', () => {

    it('it returns empty list when no product exists ', async () => {
        const res = await request(app).get('/api/products/');

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.data.length).toBe(0);

    });
    it('it returns 200 with products when product exists', async () => {

        const createProduct = await productModel.create({
            title: 'test_title',
            description: 'test_desc',
            price: {
                amount: 1000,
                currency: "INR"
            },
            seller: new mongoose.Types.ObjectId(),
            images: [{
                url: 'http://test-image.com/sample.jpg',
                thumbnail: 'http://test-image.com/thumb.jpg',
                id: 'mock_id_123'
            }],
            category: 'Clothes'
        });
        const res = await request(app).get('/api/products/');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);

        const product = res.body.data[0];

        expect(product.title).toBe('test_title');
        expect(product.description).toBe('test_desc');
        expect(product.price.amount).toBe(1000);
        expect(product.price.currency).toBe('INR');
        expect(product.category).toBe('Clothes');
        expect(product.seller.toString()).toBe(createProduct.seller.toString());

        expect(product.images[0].url).toBe('http://test-image.com/sample.jpg');
        expect(product.images[0].thumbnail).toBe('http://test-image.com/thumb.jpg');
        expect(product.images[0].id).toBe('mock_id_123');



    });
    it('filters products by search query', async () => {
        await productModel.create({
            title: 'Red Shirt',
            description: 'Cotton shirt',
            price: { amount: 500, currency: 'INR' },
            seller: new mongoose.Types.ObjectId(),
            category: 'Clothes'
        });

        const res = await request(app).get('/api/products?q=shirt');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
    });

    it('filters products by price range', async () => {
        await productModel.create({
            title: "cheap",
            price: { amount: 200, currency: "INR" },
            seller: new mongoose.Types.ObjectId(),
            category: "Clothes"
        });
        await productModel.create({
            title: "expensive",
            price: { amount: 2000, currency: "INR" },
            seller: new mongoose.Types.ObjectId(),
            category: "Clothes"
        });
        const res = await request(app).get('/api/products?minPrice=500&maxPrice=2500');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].title).toBe('expensive');
    });

    it('supports pagination', async () => {
        await productModel.create(
            Array.from({ length: 30 }).map((_, i) => ({
                title: `Product ${i}`,
                price: { amount: 1000, currency: 'INR' },
                seller: new mongoose.Types.ObjectId(),
                category: 'Clothes'
            }))
        );

        const res = await request(app).get('/api/products?skip=0&limit=20');

        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(20);

    });

});