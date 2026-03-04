require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

// Redis client
const redis = createClient({ url: process.env.REDIS_URL });
if (process.env.NODE_ENV !== "test") {
  redis.connect();
}

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Generate access token
function generateAccess(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

// Generate refresh token
function generateRefresh(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

// Login route
app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE username=? OR email=?",
    [identifier, identifier]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccess(user);
  const refreshToken = generateRefresh(user);

  await redis.set(`refresh:${user.id}`, refreshToken, {
    EX: 7 * 24 * 60 * 60
  });

  res.json({ accessToken, refreshToken });
});

module.exports = app;