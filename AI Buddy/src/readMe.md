## why using http server instead of express app?

Actually, this is one of the most common points of confusion when starting with WebSockets!

While Express is great for handling standard web requests (like clicking a link or submitting a form), it isn't built to handle the persistent, two-way connection that WebSockets (Socket.io) require.

Here is the breakdown of why the http server acts as the "middleman":

# 1. The Protocol Difference (HTTP vs. WebSockets)
Express is a framework specifically for HTTP (HyperText Transfer Protocol). HTTP works on a "Request-Response" cycle: you ask for a page, the server gives it to you, and the connection closes.

Socket.io uses WebSockets, which start as an HTTP request but "upgrade" to a permanent, open connection. Express doesn't know how to handle that "upgrade" on its own. By using the Node.js http module, you are creating a base server that can handle both:

Express handles the standard GET/POST routes.

Socket.io handles the real-time events.

# 2. The "Handshake" Mechanism
When a user tries to connect to your socket, they first send a regular HTTP request.

The http.Server receives this request.

If it's a normal URL (like /api/login), it passes it to Express.

If it's a connection request for /socket.io, it passes it to Socket.io.


# 3. Sharing the Same Port
By wrapping the Express app inside the http server, both your REST API and your Sockets can run on Port 5005 simultaneously. Without this, you might have to run them on two different ports, which causes issues with CORS and complicates your deployment.


# 4. schema: z.object({
  query: z.string().describe('The search query for products')
})

AI sirf ek cheez bhej sakta hai:
query → string hona chahiye
❌ Agar AI galat input de:
Tool execute hi nahi hoga

##  StateGraph
Matlab: Ye LangGraph library ki ek core Class hai.

Role: Iska kaam hai ek "Map" taiyar karna. Jaise kisi raste mein alag-alag stops (nodes) hote hain aur unke beech ki sadkein (edges), StateGraph wahi structure manage karta hai.

## MessagesAnnotation
Matlab: Ye ek pre-defined Schema ya "Structure" hai.

Role: Ye graph ko batata hai ki uski State (memory) kaisi dikhegi. MessagesAnnotation ka matlab hai ki aapka graph sirf text nahi, balki AI aur Human ke beech hone wale Messages ki list ko yaad rakhega aur manage karega. Isme automatically "append" (naya message jodhne) ki functionality hoti hai.

##  flow
state.messages = [
  new HumanMessage({
    content: "iPhone dikhao"
  }),

  new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "searchProducts",
        args: { query: "iphone" }
      }
    ]
  }),

  new ToolMessage({
    content: JSON.stringify([
      { id: "p1", name: "iPhone 14", price: 70000 },
      { id: "p2", name: "iPhone 13", price: 60000 }
    ]),
    toolName: "searchProducts"
  }),

  new AIMessage({
    content: "iPhone 14 aur iPhone 13 available hain. Kaunsa add karna hai?"
  }),

  new HumanMessage({
    content: "iPhone 14 cart me daal do"
  }),

  new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "addProductToCart",
        args: { productId: "p1", quantity: 1 }
      }
    ]
  }),

  new ToolMessage({
    content: "Added product with id p1 (quantity:1) to the cart",
    toolName: "addProductToCart"
  })
];
