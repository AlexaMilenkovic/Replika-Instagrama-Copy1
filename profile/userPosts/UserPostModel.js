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

const getUserPosts = async (userId, requesterId) => {
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

  const [posts] = await pool.execute(
    `SELECT 
       p.id, p.caption, p.created_at, p.updated_at,
       COUNT(DISTINCT l.user_id) AS likes_count,
       COUNT(DISTINCT c.id)      AS comments_count
     FROM posts p
     LEFT JOIN likes l ON l.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
     WHERE p.user_id = ? AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId]
  );

  if (posts.length === 0) return { data: [] };

  const postIds = posts.map(p => p.id);
  const placeholders = postIds.map(() => '?').join(',');
  const [mediaRows] = await pool.execute(
    `SELECT id, post_id, media_url, media_type, media_size_mb, created_at
     FROM post_media
     WHERE post_id IN (${placeholders})
     ORDER BY id ASC`,
    postIds
  );

  const mediaByPost = mediaRows.reduce((acc, m) => {
    if (!acc[m.post_id]) acc[m.post_id] = [];
    acc[m.post_id].push(m);
    return acc;
  }, {});

  const result = posts.map(p => ({
    ...p,
    media: mediaByPost[p.id] || [],
  }));

  return { data: result };
};

module.exports = { getUserPosts };