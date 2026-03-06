const app = require('./UserFollowingController');

const PORT = process.env.PORT || 3011;
app.listen(PORT, () => console.log(`UserFollowing service running on port ${PORT}`));