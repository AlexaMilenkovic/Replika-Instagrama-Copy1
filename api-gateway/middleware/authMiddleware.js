const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const redis = require('redis');

// Povezivanje na Redis
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});
 
(async () => {
  try {
    await client.connect();
  } catch (e) {
    console.error('Error connecting to Redis:', e);
  }
})();

// Lista javnih ruta 
const publicRoutes = [
  '/api/authentication/login',
  '/api/authentication/register'
];

// Provera blacklist-e u Redis-u
async function isBlacklisted(token) {
  try {
    const reply = await client.get(`blacklist:${token}`);
    return reply === 'true';
  } catch (err) {
    console.error('Redis blacklist error:', err);
    return false;
  }
}

module.exports = async function (req, res, next) {
  // Proveri javne rute
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nema Authorization header-a' });
  }

  const token = authHeader.split(' ')[1];

  // Provera blacklist-e
  if (await isBlacklisted(token)) {
    return res.status(401).json({ error: 'Token je blokiran (blacklist)' });
  }

  try {
    // Validacija JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Dodavanje userId i username iz tokena u custom headere
    req.headers['x-user-id'] = decoded.userId || decoded.id || '';
    req.headers['x-username'] = decoded.username || '';

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Nevalidan JWT token' });
  }
};