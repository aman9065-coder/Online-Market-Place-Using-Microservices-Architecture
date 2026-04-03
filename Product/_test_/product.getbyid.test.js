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
describe('GET /api/products/:id',()=>{
  it('returns 200 and the product when valid id is provided',async()=>{
    let productId;
    const product = await productModel.create({
            title: 'Test Product',
            description: 'Test description',
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
        productId = product._id.toString();
        const res = await request(app).get(`/api/products/${productId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.product).toBeDefined();
        expect(res.body.product.title).toBe('Test Product');
        expect(res.body.product.description).toBe('Test description');
        expect(res.body.product.price.amount).toBe(1000);
        expect(res.body.product.price.currency).toBe('INR');
        expect(res.body.product.category).toBe('Clothes');
        expect(res.body.product.images[0].url).toBe('http://test-image.com/sample.jpg');

  });
  it('returns 400 for invalid id format ',async()=>{
      const res = await request(app).get(`/api/products/123-invalid-id`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBeDefined(); 
  });
  it('returns 404 when product not found',async()=>{
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('product not found');
  });
});