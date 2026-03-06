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

const getFeedTotal = async (requesterId) => {
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(DISTINCT p.id) AS total
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN user_relations ur
       ON ur.target_user_id = p.user_id
      AND ur.user_id = ?
      AND ur.status = 'following'
     WHERE p.deleted_at IS NULL
       AND u.deleted_at IS NULL
       AND p.user_id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = ?
         UNION
         SELECT blocker_id FROM blocks WHERE blocked_id = ?
       )`,
    [requesterId, requesterId, requesterId]
  );
  return total;
};

const getFeed = async (requesterId, limit = 20, offset = 0) => {
  const total = await getFeedTotal(requesterId);

  if (total === 0) return { data: [], total: 0, has_more: false };

  const [posts] = await pool.execute(
    `SELECT 
       p.id, p.user_id, p.caption, p.created_at, p.updated_at,
       u.username, u.first_name, u.last_name, u.profile_image_url,
       COUNT(DISTINCT l.user_id)  AS likes_count,
       COUNT(DISTINCT c.id)       AS comments_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     JOIN user_relations ur
       ON ur.target_user_id = p.user_id
      AND ur.user_id = ?
      AND ur.status = 'following'
     LEFT JOIN likes l ON l.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id AND c.deleted_at IS NULL
     WHERE p.deleted_at IS NULL
       AND u.deleted_at IS NULL
       AND p.user_id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = ?
         UNION
         SELECT blocker_id FROM blocks WHERE blocked_id = ?
       )
     GROUP BY p.id, u.username, u.first_name, u.last_name, u.profile_image_url
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [requesterId, requesterId, requesterId, limit, offset]
  );

  if (posts.length === 0) return { data: [], total, has_more: false };

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

  return {
    data: result,
    total,
    has_more: offset + posts.length < total,
  };
};

module.exports = { getFeed, getFeedTotal };