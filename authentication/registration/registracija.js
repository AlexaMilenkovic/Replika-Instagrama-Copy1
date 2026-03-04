require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      `INSERT INTO users 
       (first_name,last_name,username,email,password_hash) 
       VALUES (?,?,?,?,?)`,
      [firstName, lastName, username, email, hashed]
    );

    res.status(201).json({ message: "User registered" });

  } catch (err) {

    // Duplicate entry (MySQL error code)
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "User already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

module.exports = app;