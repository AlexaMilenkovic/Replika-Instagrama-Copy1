const express = require('express');
const fetch = require('node-fetch');
const { searchUsers } = require('./searchModel');

const app = express();
app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/protected`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.json();
      return res.status(401).json({ error: body.message || 'Unauthorized' });
    }

    const data = await response.json();
    req.user = data.user;
    next();
  } catch (err) {
    console.error('[AuthMiddleware] Auth service unreachable:', err.message);
    return res.status(503).json({ error: 'Authentication service unavailable' });
  }
};

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'search' }));

app.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  if (q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  try {
    const users = await searchUsers(q.trim(), req.user.id);
    return res.status(200).json({ users });
  } catch (err) {
    console.error('[Search] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;