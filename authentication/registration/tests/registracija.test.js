process.env.NODE_ENV = "test";

/* ---------- SHARED MOCK ---------- */

const mockExecute = jest.fn();

jest.mock("mysql2/promise", () => ({
  createPool: () => ({
    execute: mockExecute,
  }),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

/* ---------- IMPORT AFTER MOCK ---------- */

const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../registracija");

describe("Registration Service", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if fields are missing", async () => {

    const res = await request(app)
      .post("/register")
      .send({ username: "test" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("All fields required");
  });

  it("should register user successfully", async () => {

    bcrypt.hash.mockResolvedValue("hashedpassword");
    mockExecute.mockResolvedValue([{}]);

    const res = await request(app)
      .post("/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        email: "john@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered");

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(mockExecute).toHaveBeenCalled();
  });

  it("should return 409 if user already exists", async () => {

    bcrypt.hash.mockResolvedValue("hashedpassword");

    const error = new Error("Duplicate");
    error.code = "ER_DUP_ENTRY";

    mockExecute.mockRejectedValue(error);

    const res = await request(app)
      .post("/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        email: "john@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe("User already exists");
  });

});