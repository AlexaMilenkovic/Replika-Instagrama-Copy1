require('dotenv').config();
const express = require('express');
const { hashPassword, createUser } = require('./RegistrationModel');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'registration' }));

app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const passwordHash = await hashPassword(password);
    await createUser(firstName, lastName, username, email, passwordHash);
    return res.status(201).json({ message: 'User registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'User already exists' });
    }
    console.error('[Registration] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;