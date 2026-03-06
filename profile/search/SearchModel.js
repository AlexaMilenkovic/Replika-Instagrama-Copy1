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

const searchUsers = async (query, requesterId) => {
  const like = `%${query}%`;

  const [rows] = await pool.execute(
    `SELECT 
       u.id, u.first_name, u.last_name, u.username, u.bio, u.profile_image_url, u.is_private
     FROM users u
     WHERE 
       u.deleted_at IS NULL
       AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ?)
       AND u.id NOT IN (
         SELECT blocked_id FROM blocks WHERE blocker_id = ?
         UNION
         SELECT blocker_id FROM blocks WHERE blocked_id = ?
       )
     ORDER BY u.username ASC
     LIMIT 50`,
    [like, like, like, requesterId, requesterId]
  );

  return rows;
};

module.exports = { searchUsers };