const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
});

const USER_FOLLOWS_URL = process.env.USER_FOLLOWS_URL || 'http://user-follows:3011';

// ─── Helpers ──────────────────────────────────────────────
const isBlocked = async (userA, userB) => {
  const res = await fetch(
    `${USER_FOLLOWS_URL}/blocks/check?userA=${userA}&userB=${userB}`
  );
  const data = await res.json();
  return data.blocked === true;
};

const getFollowersCount = async (userId) => {
  const res = await fetch(`${USER_FOLLOWS_URL}/followers/count/${userId}`);
  const data = await res.json();
  return data.count ?? 0;
};

const getFollowingCount = async (userId) => {
  const res = await fetch(`${USER_FOLLOWS_URL}/following/count/${userId}`);
  const data = await res.json();
  return data.count ?? 0;
};

const getIsFollowing = async (requesterId, userId) => {
  const res = await fetch(
    `${USER_FOLLOWS_URL}/following/check?followerId=${requesterId}&followingId=${userId}`
  );
  const data = await res.json();
  return data.isFollowing === true;
};

// ─── Search ───────────────────────────────────────────────
const searchUsers = async (query, requesterId) => {
  const like = `%${query}%`;

  const [rows] = await pool.execute(
    `SELECT 
       id, first_name, last_name, username, bio, profile_image_url, is_private
     FROM users
     WHERE
       deleted_at IS NULL
       AND (first_name LIKE ? OR last_name LIKE ? OR username LIKE ?)
     ORDER BY username ASC
     LIMIT 50`,
    [like, like, like]
  );

  // Filter out blocked users via user-follows service
  const results = await Promise.all(
    rows.map(async (user) => {
      const blocked = await isBlocked(requesterId, user.id);
      return blocked ? null : user;
    })
  );

  return results.filter(Boolean);
};

// ─── User Info ────────────────────────────────────────────
const getUserInfo = async (userId, requesterId) => {
  const [userRows] = await pool.execute(
    `SELECT
       id, first_name, last_name, username, bio, profile_image_url, is_private, created_at
     FROM users
     WHERE id = ? AND deleted_at IS NULL`,
    [userId]
  );

  if (userRows.length === 0) return { error: 'User not found', status: 404 };

  const user = userRows[0];

  // Block check via user-follows service
  const blocked = await isBlocked(requesterId, userId);
  if (blocked) return { error: 'User not found', status: 404 };

  // Social counts via user-follows service
  const [followers_count, following_count, is_following] = await Promise.all([
    getFollowersCount(userId),
    getFollowingCount(userId),
    getIsFollowing(requesterId, userId),
  ]);

  return {
    data: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      bio: user.bio,
      profile_image_url: user.profile_image_url,
      is_private: user.is_private === 1,
      created_at: user.created_at,
      followers_count,
      following_count,
      is_following,
    }
  };
};

module.exports = { searchUsers, getUserInfo };