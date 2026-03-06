require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });

if (process.env.NODE_ENV !== 'test') {
  redis.connect();
}

const isTokenBlacklisted = async (token) => {
  return await redis.get(`blacklist:${token}`);
};

module.exports = { isTokenBlacklisted };