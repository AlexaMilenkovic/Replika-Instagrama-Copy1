require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const createUser = async (firstName, lastName, username, email, passwordHash) => {
  await pool.execute(
    `INSERT INTO users 
     (first_name, last_name, username, email, password_hash) 
     VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, username, email, passwordHash]
  );
};

module.exports = { hashPassword, createUser };