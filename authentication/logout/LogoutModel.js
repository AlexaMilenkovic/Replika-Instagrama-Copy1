require('dotenv').config();
const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL });

if (process.env.NODE_ENV !== 'test') {
  redis.connect();
}

const blacklistAccessToken = async (token, exp) => {
  await redis.set(`blacklist:${token}`, 'true', { EX: exp });
};

const deleteRefreshToken = async (userId) => {
  await redis.del(`refresh:${userId}`);
};

module.exports = { blacklistAccessToken, deleteRefreshToken };