require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { createClient } = require('redis');

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Redis client
const redis = createClient({ url: process.env.REDIS_URL });
if (process.env.NODE_ENV !== 'test') {
  redis.connect();
}

const findUserByIdentifier = async (identifier) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username=? OR email=?',
    [identifier, identifier]
  );
  return rows[0] || null;
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(`refresh:${userId}`, refreshToken, {
    EX: 7 * 24 * 60 * 60,
  });
};

module.exports = {
  findUserByIdentifier,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
};