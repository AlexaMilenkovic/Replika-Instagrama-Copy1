require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { isTokenBlacklisted } = require('./AuthModel');

const app = express();
app.use(express.json());

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) return res.status(401).json({ message: 'Token revoked' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

module.exports = app;