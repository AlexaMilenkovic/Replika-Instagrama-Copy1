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

const getFollowing = async (userId, requesterId) => {
  const [userRows] = await pool.execute(
    `SELECT id, is_private FROM users WHERE id = ? AND deleted_at IS NULL`,
    [userId]
  );

  if (userRows.length === 0) return { error: 'User not found', status: 404 };

  const targetUser = userRows[0];

  const [blockRows] = await pool.execute(
    `SELECT 1 FROM blocks 
     WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`,
    [requesterId, userId, userId, requesterId]
  );
  if (blockRows.length > 0) return { error: 'User not found', status: 404 };

  if (targetUser.is_private && userId !== requesterId) {
    const [followRows] = await pool.execute(
      `SELECT 1 FROM user_relations 
       WHERE user_id = ? AND target_user_id = ? AND status = 'following'`,
      [requesterId, userId]
    );
    if (followRows.length === 0) {
      return { error: 'This profile is private', status: 403 };
    }
  }

  const [rows] = await pool.execute(
    `SELECT 
       u.id, u.first_name, u.last_name, u.username, u.profile_image_url, u.is_private
     FROM user_relations ur
     JOIN users u ON u.id = ur.target_user_id
     WHERE ur.user_id = ? AND ur.status = 'following' AND u.deleted_at IS NULL
     ORDER BY ur.created_at DESC`,
    [userId]
  );

  return { data: rows };
};

module.exports = { getFollowing };