const request = require("supertest");
const app = require("../src/app");
const userModel = require("../src/models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../src/db/redis"); // top pe import add karo

describe("GET /api/auth/me", () => {
  it("returns 200 and current user when valid token cookie is present ", async () => {
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);
    await userModel.create({
      username: "john_doe",
      email: "test@example.com",
      password: hash,
      fullname: {
        firstname: "John",
        lastname: "Doe",
      },
      addresses: [
        {
          street: "123 Test Lane",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          zip: "400001",
        },
      ],
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Secret123!",
    });

    const cookie = loginRes.headers["set-cookie"][0];

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("john_doe");
    expect(res.body.user.email).toBe("test@example.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.fullname.firstname).toBe("John");
    expect(res.body.user.fullname.lastname).toBe("Doe");
    expect(res.body.user.addresses).toBeInstanceOf(Array);
    expect(res.body.user.addresses[0].street).toBe("123 Test Lane");
    expect(res.body.user.addresses[0].city).toBe("Mumbai");
    expect(res.body.user.addresses[0].state).toBe("Maharashtra");
    expect(res.body.user.addresses[0].country).toBe("India");
    expect(res.body.user.addresses[0].zip).toBe("400001");
  });
  it("returns 401 when no auth cookie is provided", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.statusCode).toBe(401);
  });
  it("returns 401 invalid token in cookie ", async () => {
    const fakeToken = jwt.sign({ id: "0000000000" }, "wrong_secret");
    const res = await request(app)
      .get("/api/auth/me")
      .set("cookie", [`token=${fakeToken}`]);
    expect(res.statusCode).toBe(401);
  });

  // ... existing tests ke andar hi ye naya test add karo

  it("returns 401 when token is blacklisted", async () => {
    const password = "Secret123!";
    const hash = await bcrypt.hash(password, 10);
    await userModel.create({
      username: "jane_doe",
      email: "jane@example.com",
      password: hash,
      fullname: {
        firstname: "Jane",
        lastname: "Doe",
      },
      addresses: [
        {
          street: "456 Test Lane",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          zip: "400001",
        },
      ],
    });

    // Step 1: Login karke valid token/cookie generate karo
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "Secret123!",
    });

    const cookie = loginRes.headers["set-cookie"][0];

    // Step 2: Cookie string se raw token nikaalo
    // cookie format: "token=xxxxx; Path=/; HttpOnly"
    const token = cookie.split(";")[0].split("=")[1];

    // Step 3: Manually is token ko redis blacklist me daal do
    // (jaise logout ke time hota hai)
    await redis.set(`blacklist_${token}`, "true");

    // Step 4: Ab isi (blacklisted) cookie ke sath request bhejo
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token has been blacklisted");
  });
  
});
