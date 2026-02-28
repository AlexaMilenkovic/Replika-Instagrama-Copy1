require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL });

if (process.env.NODE_ENV !== "test") {
  redis.connect();
}

app.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { refreshToken } = req.body;

  if (!token) return res.status(400).json({ message: "Token required" });

  const decoded = jwt.decode(token);
  const exp = decoded.exp - Math.floor(Date.now() / 1000);

  await redis.set(`blacklist:${token}`, "true", { EX: exp });

  if (refreshToken) {
    const payload = jwt.decode(refreshToken);
    await redis.del(`refresh:${payload.userId}`);
  }

  res.json({ message: "Logged out" });
});

module.exports = app;