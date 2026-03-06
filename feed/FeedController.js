const express = require('express');
const jwt = require('jsonwebtoken');
const { getFeed } = require('./FeedModel');

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

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'feed' }));

app.get('/feed', authMiddleware, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0,  0);

  try {
    const result = await getFeed(req.user.id, limit, offset);
    return res.status(200).json({
      posts:    result.data,
      total:    result.total,
      has_more: result.has_more,
      limit,
      offset,
      next_offset: result.has_more ? offset + limit : null,
    });
  } catch (err) {
    console.error('[Feed] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;