const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'instagram_replika',
  waitForConnections: true,
  connectionLimit: 10,
});

const getUserInfo = async (userId, requesterId) => {
  const [userRows] = await pool.execute(
    `SELECT 
       id, first_name, last_name, username, bio, profile_image_url, is_private,
       created_at
     FROM users 
     WHERE id = ? AND deleted_at IS NULL`,
    [userId]
  );

  if (userRows.length === 0) return { error: 'User not found', status: 404 };

  const user = userRows[0];

  const [blockRows] = await pool.execute(
    `SELECT 1 FROM blocks 
     WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    [requesterId, userId, userId, requesterId]
  );
  if (blockRows.length > 0) return { error: 'User not found', status: 404 };

  const [[{ followers_count }]] = await pool.execute(
    `SELECT COUNT(*) AS followers_count FROM user_relations 
     WHERE target_user_id = ? AND status = 'following'`,
    [userId]
  );

  const [[{ following_count }]] = await pool.execute(
    `SELECT COUNT(*) AS following_count FROM user_relations 
     WHERE user_id = ? AND status = 'following'`,
    [userId]
  );

  const [followRows] = await pool.execute(
    `SELECT 1 FROM user_relations 
     WHERE user_id = ? AND target_user_id = ? AND status = 'following'`,
    [requesterId, userId]
  );
  const isFollowing = followRows.length > 0;

  return {
    data: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      bio: user.bio,
      profile_image_url: user.profile_image_url,
      is_private: user.is_private === 1,
      followers_count,
      following_count,
      is_following: isFollowing,
    }
  };
};

module.exports = { getUserInfo };