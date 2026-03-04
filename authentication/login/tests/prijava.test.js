process.env.JWT_SECRET = "testsecret";
process.env.JWT_REFRESH_SECRET = "refreshsecret";
process.env.NODE_ENV = "test";

/* ---------- SHARED MOCKS ---------- */

const mockExecute = jest.fn();

jest.mock("mysql2/promise", () => ({
  createPool: () => ({
    execute: mockExecute,
  }),
}));

jest.mock("redis", () => ({
  createClient: () => ({
    connect: jest.fn(),
    set: jest.fn(),
  }),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

/* ---------- IMPORT AFTER MOCKS ---------- */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = require("../prijava");

/* ---------- TESTS ---------- */

describe("Login Service", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it("should handle redis set failure gracefully", async () => {
  const fakeUser = { id: 1, username: "testuser", password_hash: "hashedpassword" };
  mockExecute.mockResolvedValue([[fakeUser]]);
  bcrypt.compare.mockResolvedValue(true);

  const redis = require("redis");
  redis.createClient().set.mockRejectedValue(new Error("Redis down"));

  const res = await request(app)
    .post("/login")
    .send({ identifier: "testuser", password: "password123" });

  // expect your route to handle the error, e.g. fail or still return accessToken
  });

  it("should fail with invalid credentials", async () => {

    // baza ne vraća usera
    mockExecute.mockResolvedValue([[]]);

    const res = await request(app)
      .post("/login")
      .send({ identifier: "nonexistent", password: "wrong" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should fail with invalid password", async () => {
  const fakeUser = {
    id: 1,
    username: "testuser",
    password_hash: "hashedpassword"
  };

  mockExecute.mockResolvedValue([[fakeUser]]);
  bcrypt.compare.mockResolvedValue(false); // simulate wrong password

  const res = await request(app)
    .post("/login")
    .send({ identifier: "testuser", password: "wrongpassword" });

  expect(res.statusCode).toBe(401);
  expect(res.body.message).toBe("Invalid credentials");
  });

  it("should login successfully with correct credentials", async () => {

    const fakeUser = {
      id: 1,
      username: "testuser",
      password_hash: "hashedpassword"
    };

    mockExecute.mockResolvedValue([[fakeUser]]);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/login")
      .send({ identifier: "testuser", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");

    const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(1);
  });

});