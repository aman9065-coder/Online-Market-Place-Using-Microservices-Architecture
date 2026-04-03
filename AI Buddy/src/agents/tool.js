require("dotenv").config();
const { tool } = require('@langchain/core/tools');
const z = require('zod');
const axios = require('axios');


const searchProducts = tool(async ({ query, token }) => {
    // console.log(query , token);
    
    const response = await axios.get(`-alb-1417250781.ap-south-1.elb.amazonaws.com/api/products?q=${query}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return JSON.stringify(response.data);
}, {
    name: "searchProducts",
    description: "Search for product based on query",
    schema: z.object({
        query: z.string().describe('The search query for products')
    })
});

const addProductToCart = tool(async ({ productId, quantity = 1, token }) => {

    const response = await axios.post('http://vendex-alb-1-1449366652.ap-south-1.elb.amazonaws.com/api/cart/items',{
        productId,quantity
    },{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })

    return `Added product with id ${productId} (quantity:${quantity}) to the cart`

}, {
    name: "addProductToCart",
    description: "Add product to the shopping cart",
    schema: z.object({
        productId: z.string().describe('The id of the product to add to the cart'),
        quantity: z.number().optional().describe('The quantity of the product to add to the cart')
    })
});

module.exports = {
    searchProducts,addProductToCart
}