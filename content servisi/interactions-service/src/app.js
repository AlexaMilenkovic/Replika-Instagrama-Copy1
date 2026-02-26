import express from "express";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(express.json());

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });

async function postExists(postId) {
  const r = await fetch(`${process.env.POST_SERVICE_URL}/posts/${postId}/meta`);
  if (r.status === 404) return false;
  if (!r.ok) throw new Error("Post service error");
  return true;
}

/**
 * 1.5 like/unlike i count
 */
app.post("/posts/:id/likes", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  if (!(await postExists(req.params.id))) return res.status(404).json({ error: "post not found" });

  try {
    await pool.execute("INSERT INTO likes (user_id, post_id) VALUES (?, ?)", [userId, req.params.id]);
  } catch {
    // ignorise duplikat
  }
  res.json({ ok: true });
});

app.delete("/posts/:id/likes", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  await pool.execute("DELETE FROM likes WHERE user_id=? AND post_id=?", [userId, req.params.id]);
  res.json({ ok: true });
});

app.get("/posts/:id/likes/count", async (req, res) => {
  const [rows] = await pool.execute("SELECT COUNT(*) c FROM likes WHERE post_id=?", [req.params.id]);
  res.json({ count: rows[0].c });
});

/**
 * 1.6 comments: add/edit/delete i count
 */
app.post("/posts/:id/comments", async (req, res) => {
  const { userId, content } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  if (!(await postExists(req.params.id))) return res.status(404).json({ error: "post not found" });

  const [r] = await pool.execute(
    "INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)",
    [userId, req.params.id, content]
  );
  res.status(201).json({ id: r.insertId });
});

app.put("/comments/:commentId", async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  await pool.execute("UPDATE comments SET content=? WHERE id=?", [content, req.params.commentId]);
  res.json({ ok: true });
});

app.delete("/comments/:commentId", async (req, res) => {
  await pool.execute("DELETE FROM comments WHERE id=?", [req.params.commentId]);
  res.json({ ok: true });
});

app.get("/posts/:id/comments/count", async (req, res) => {
  const [rows] = await pool.execute("SELECT COUNT(*) c FROM comments WHERE post_id=?", [req.params.id]);
  res.json({ count: rows[0].c });
});

/**
 * post service zove kad brise post
 */
app.delete("/interactions/by-post/:postId", async (req, res) => {
  await pool.execute("DELETE FROM likes WHERE post_id=?", [req.params.postId]);
  await pool.execute("DELETE FROM comments WHERE post_id=?", [req.params.postId]);
  res.json({ ok: true });
});

app.listen(process.env.PORT || 3002, () => {
  console.log(`Interactions service running on ${process.env.PORT || 3002}`);
});