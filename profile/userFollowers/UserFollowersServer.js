const app = require('./UserFollowersController');

const PORT = process.env.PORT || 3012;
app.listen(PORT, () => console.log(`UserFollowers service running on port ${PORT}`));