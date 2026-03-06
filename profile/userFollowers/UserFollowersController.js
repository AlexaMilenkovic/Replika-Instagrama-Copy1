const express = require('express');
const jwt = require('jsonwebtoken');
const { getFollowers } = require('./UserFollowersModel');

const app = express();
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'userFollowers' }));

app.get('/users/:userId/followers', authMiddleware, async (req, res) => {
  const targetUserId = parseInt(req.params.userId);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const result = await getFollowers(targetUserId, req.user.id);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(200).json({ followers: result.data });
  } catch (err) {
    console.error('[UserFollowers] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;