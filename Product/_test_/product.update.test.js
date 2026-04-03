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
const sellerId = new mongoose.Types.ObjectId();

describe('PATCH /api/products/:id', () => {
    let productId;
    it('returns 400 for invalid id format', async () => {
        const token = jwt.sign({ id: sellerId, role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);
        const res = await request(app).patch('/api/products/123-sample-id').set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBeDefined();
    });
    it('returns 404 when product not found', async () => {
        const token = jwt.sign({ id: sellerId, role: 'seller', username: 'john@123', email: 'test@example.com' }, process.env.JWT_SECRET);
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).patch(`/api/products/${fakeId}`).set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('product not found');
    });
    it('returns 200 when product updated', async () => {
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
        productId = product._id.toString();
        const res = await request(app).patch(`/api/products/${productId}`)
            .set(`Authorization`, `Bearer ${token}`)
            .send({
                title: "update_title",
                description: "update_desc"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.product.title).toBe("update_title");
        expect(res.body.product.description).toBe("update_desc");
    });
    it('returns 401 when no auth cookie is provided', async () => {
        const res = await request(app).patch(`/api/products/${productId}`)
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized No token");

    });
    it('returns 401 invalid token in cookie ', async () => {
        const fakeToken = jwt.sign(
            { id: "123", role: "seller" },
            "WRONG_SECRET"
        );

        const res = await request(app).patch(`/api/products/${productId}`)
            .set('cookie', [`token=${fakeToken}`]);
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("Unauthorized invalid token");
    });
    it('returns 403 when seller tries to update another seller’s product', async () => {
        const ownerSellerId = new mongoose.Types.ObjectId();
        const otherSellerId = new mongoose.Types.ObjectId();

        // create product owned by ownerSellerId
        const product = await productModel.create({
            title: 'original_title',
            description: 'original_desc',
            price: {
                amount: 2000,
                currency: 'INR'
            },
            seller: ownerSellerId,
            images: [{
                url: 'http://test-image.com/sample.jpg',
                thumbnail: 'http://test-image.com/thumb.jpg',
                id: 'mock_id_123'
            }],
            category: 'Clothes'
        });

        // token of DIFFERENT seller
        const token = jwt.sign(
            {
                id: otherSellerId.toString(),
                role: 'seller',
                username: 'other@123',
                email: 'other@example.com'
            },
            process.env.JWT_SECRET
        );

        const res = await request(app)
            .patch(`/api/products/${product._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'hacked_title'
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBeDefined();
    });

});
