require('dotenv').config();
const express = require('express');
const {
  findUserByIdentifier,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
} = require('./LoginModel');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'login' }));

app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  try {
    const user = await findUserByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await storeRefreshToken(user.id, refreshToken);

    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    console.error('[Login] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;