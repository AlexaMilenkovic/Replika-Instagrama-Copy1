process.env.JWT_SECRET = "testsecret";
process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("redis", () => ({
  createClient: () => ({
    connect: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }),
}));

const redisMock = require("redis").createClient();

const express = require("express");
const app = express();
app.use(express.json());

app.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { refreshToken } = req.body;

  if (!token) return res.status(400).json({ message: "Token required" });

  const decoded = jwt.decode(token);
  const exp = decoded.exp - Math.floor(Date.now() / 1000);

  await redisMock.set(`blacklist:${token}`, "true", { EX: exp });

  if (refreshToken) {
    const payload = jwt.decode(refreshToken);
    await redisMock.del(`refresh:${payload.userId}`);
  }

  res.json({ message: "Logged out" });
});

describe("Logout Service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fails if token missing", async () => {
    const res = await request(app)
      .post("/logout")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Token required");
  });

  it("logs out with token only", async () => {
    const token = jwt.sign({ userId:1 }, process.env.JWT_SECRET);
    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out");
    expect(redisMock.set).toHaveBeenCalled();
  });

  it("logs out with token and refresh token", async () => {
    const token = jwt.sign({ userId:1 }, process.env.JWT_SECRET);
    const refresh = jwt.sign({ userId:1 }, process.env.JWT_SECRET);

    const res = await request(app)
      .post("/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({ refreshToken: refresh });

    expect(res.statusCode).toBe(200);
    expect(redisMock.set).toHaveBeenCalled();
    expect(redisMock.del).toHaveBeenCalled();
  });
});