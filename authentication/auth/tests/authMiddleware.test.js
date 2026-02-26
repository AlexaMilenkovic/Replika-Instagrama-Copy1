process.env.JWT_SECRET = "testsecret";
process.env.JWT_REFRESH_SECRET = "refreshsecret";
process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("redis", () => ({
  createClient: () => ({
    connect: jest.fn(),
    get: jest.fn(),
  }),
}));

const redisMock = require("redis").createClient();

const express = require("express");
const app = express();
app.use(express.json());

// Auth middleware
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const blacklisted = await redisMock.get(`blacklist:${token}`);
  if (blacklisted) return res.status(401).json({ message: "Token revoked" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

describe("Auth Middleware", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("denies access if token missing", async () => {
    const res = await request(app).get("/protected");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("denies access if token is blacklisted", async () => {
    const token = "blacklistedtoken";
    redisMock.get.mockResolvedValue("true");

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token revoked");
  });

  it("denies access if token invalid", async () => {
    redisMock.get.mockResolvedValue(null);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("allows access if token valid", async () => {
    redisMock.get.mockResolvedValue(null);
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.userId).toBe(1);
  });

});