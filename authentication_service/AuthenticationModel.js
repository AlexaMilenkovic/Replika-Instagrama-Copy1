require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { createClient } = require('redis');

// ─── MySQL Pool ───────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.AUTH_DB_NAME || 'user_related_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Redis Client ─────────────────────────────────────────
const redis = createClient({ url: process.env.REDIS_URL });
if (process.env.NODE_ENV !== 'test') {
  redis.connect();
}

// ─── Registration ─────────────────────────────────────────
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const createUser = async (firstName, lastName, username, email, passwordHash) => {
  await pool.execute(
    `INSERT INTO users (first_name, last_name, username, email, password_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, username, email, passwordHash]
  );
};

// ─── Login ────────────────────────────────────────────────
const findUserByIdentifier = async (identifier) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username=? OR email=?',
    [identifier, identifier]
  );
  return rows[0] || null;
};

const findUserById = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, bio, profile_image_url, is_private
     FROM users WHERE id = ? AND deleted_at IS NULL`,
    [userId]
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

// ─── Update user ──────────────────────────────────────────
const updateUser = async (userId, fields) => {
  const allowed = ['first_name', 'last_name', 'bio', 'profile_image_url', 'is_private', 'password_hash'];

  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key) && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) return { updated: false };

  values.push(userId);

  await pool.execute(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  return { updated: true };
};

// ─── Delete user (soft delete) ────────────────────────────
const softDeleteUser = async (userId) => {
  await pool.execute(
    `UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [userId]
  );
};

// ─── Logout ───────────────────────────────────────────────
const blacklistAccessToken = async (token, exp) => {
  await redis.set(`blacklist:${token}`, 'true', { EX: exp });
};

const deleteRefreshToken = async (userId) => {
  await redis.del(`refresh:${userId}`);
};

// ─── Token validation ─────────────────────────────────────
const isTokenBlacklisted = async (token) => {
  return await redis.get(`blacklist:${token}`);
};

module.exports = {
  hashPassword,
  createUser,
  findUserByIdentifier,
  findUserById,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  updateUser,
  softDeleteUser,
  blacklistAccessToken,
  deleteRefreshToken,
  isTokenBlacklisted,
};