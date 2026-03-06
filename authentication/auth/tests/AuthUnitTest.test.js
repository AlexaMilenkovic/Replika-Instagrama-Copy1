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

const mockRedis = require("redis").createClient();

jest.mock("../AuthModel", () => ({
  isTokenBlacklisted: async (token) => {
    return await mockRedis.get(`blacklist:${token}`);
  },
}));

const app = require("../AuthController");

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
    mockRedis.get.mockResolvedValue("true");

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token revoked");
  });

  it("denies access if token invalid", async () => {
    mockRedis.get.mockResolvedValue(null);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("allows access if token valid", async () => {
    mockRedis.get.mockResolvedValue(null);
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.userId).toBe(1);
  });

});