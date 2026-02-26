import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });

const uploadDir = process.env.UPLOAD_DIR || "uploads";
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50mb
    files: 20                   // max 20 fajlova
  }
});

function isAllowedMime(mime) {
  return mime?.startsWith("image/") || mime?.startsWith("video/");
}

/**
 * 1.4: samo foto/video, max 20, max 50mb, caption
 */
app.post("/posts", upload.array("files", 20), async (req, res) => {
  const { userId, caption } = req.body;

  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (!req.files?.length) return res.status(400).json({ error: "files[] is required" });

  for (const f of req.files) {
    if (!isAllowedMime(f.mimetype)) {
      return res.status(400).json({ error: "Only images and videos are allowed" });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [postRes] = await conn.execute(
      "INSERT INTO posts (user_id, caption) VALUES (?, ?)",
      [userId, caption ?? null]
    );

    const postId = postRes.insertId;

    for (let i = 0; i < req.files.length; i++) {
      const f = req.files[i];
      const mediaType = f.mimetype.startsWith("video/") ? "video" : "image";
      const mediaUrl = `/${uploadDir}/${f.filename}`;

      await conn.execute(
        `INSERT INTO post_media (post_id, position, media_url, media_type, media_size_bytes)
         VALUES (?, ?, ?, ?, ?)`,
        [postId, i, mediaUrl, mediaType, f.size]
      );
    }

    await conn.commit();
    res.status(201).json({ id: postId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "Failed to create post" });
  } finally {
    conn.release();
  }
});

// otvaranje preko URLa
app.use(`/${uploadDir}`, express.static(path.resolve(uploadDir)));

/**
 *proveri da li post postoji i ko je owner
 */
app.get("/posts/:id/meta", async (req, res) => {
  const [rows] = await pool.execute("SELECT id, user_id FROM posts WHERE id = ?", [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: "post not found" });
  res.json({ id: rows[0].id, userId: rows[0].user_id });
});

/**
 * 1.4: azurirqnje opisa
 */
app.put("/posts/:id", async (req, res) => {
  const { caption } = req.body;
  await pool.execute("UPDATE posts SET caption=? WHERE id=?", [caption ?? null, req.params.id]);
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Post service running on ${process.env.PORT || 3001}`);
});