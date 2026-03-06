const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const PostController = require('./controllers/PostController');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSize = Number(process.env.MAX_FILE_SIZE || 50 * 1024 * 1024);
const maxFiles = Number(process.env.MAX_FILES || 20);

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: maxFileSize,
    files: maxFiles
  }
});

app.get('/test', (req, res) => {
  res.json({ message: 'Post service is running' });
});

app.post('/posts', upload.array('files', maxFiles), PostController.createPost);

app.get('/posts/:id/meta', PostController.getPostMeta);
app.get('/posts/:id', PostController.getPostById);
app.get('/users/:userId/posts', PostController.getPostsByUserId);

app.put('/posts/:id/caption', PostController.updateCaption);

app.delete('/posts/:id', PostController.deletePost);
app.delete('/posts/:id/media/:mediaId', PostController.deletePostMedia);

app.use(`/${uploadDir}`, express.static(path.resolve(uploadDir)));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Jedan ili više fajlova prelaze 50 MB' });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: `Max ${maxFiles} fajlova dozvoljeno` });
    }

    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Serverska greška' });
});

app.listen(PORT, () => {
  console.log(`Post service running on port ${PORT}`);
});
