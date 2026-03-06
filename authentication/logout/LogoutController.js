require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { blacklistAccessToken, deleteRefreshToken } = require('./LogoutModel');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'logout' }));

app.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { refreshToken } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token required' });
  }

  try {
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const exp = decoded.exp - Math.floor(Date.now() / 1000);
    await blacklistAccessToken(token, exp);

    if (refreshToken) {
      const payload = jwt.decode(refreshToken);
      if (payload && payload.userId) {
        await deleteRefreshToken(payload.userId);
      }
    }

    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    console.error('[Logout] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;