require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const {
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
} = require('./AuthenticationModel');

const app = express();
app.use(express.json());

// ─── Auth middleware ──────────────────────────────────────
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
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ─── Health ───────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'authentication' })
);

// ─── Token validation ─────────────────────────────────────
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

// ─── Registration ─────────────────────────────────────────
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

// ─── Login ────────────────────────────────────────────────
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

// ─── Logout ───────────────────────────────────────────────
app.post('/logout', authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { refreshToken } = req.body;

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

// ─── Get own profile ──────────────────────────────────────
app.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error('[Me] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Update own profile ───────────────────────────────────
app.patch('/me', authMiddleware, async (req, res) => {
  const { firstName, lastName, bio, profileImageUrl, isPrivate, password, currentPassword } = req.body;

  // Nothing to update
  if (!firstName && !lastName && bio === undefined && profileImageUrl === undefined &&
      isPrivate === undefined && !password) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  try {
    const fields = {};

    if (firstName)            fields.first_name         = firstName;
    if (lastName)             fields.last_name          = lastName;
    if (bio !== undefined)    fields.bio                = bio;
    if (profileImageUrl !== undefined) fields.profile_image_url = profileImageUrl;
    if (isPrivate !== undefined)       fields.is_private        = isPrivate ? 1 : 0;

    // Password change requires current password verification
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const user = await findUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Fetch full user to get password_hash
      const fullUser = await findUserByIdentifier(user.id.toString());
      const valid = await verifyPassword(currentPassword, fullUser?.password_hash || '');
      if (!valid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      fields.password_hash = await hashPassword(password);
    }

    const result = await updateUser(req.user.userId, fields);

    if (!result.updated) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[UpdateProfile] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── Delete own account ───────────────────────────────────
app.delete('/me', authMiddleware, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  try {
    await softDeleteUser(req.user.userId);

    // Blacklist current access token
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      const exp = decoded.exp - Math.floor(Date.now() / 1000);
      await blacklistAccessToken(token, exp);
    }

    // Delete refresh token
    await deleteRefreshToken(req.user.userId);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('[DeleteAccount] Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;