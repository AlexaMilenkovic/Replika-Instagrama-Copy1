const app = require('./UserPostController');

const PORT = process.env.PORT || 3014;
app.listen(PORT, () => console.log(`UserPosts service running on port ${PORT}`));