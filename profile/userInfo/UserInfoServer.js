const app = require('./userInfoController');

const PORT = process.env.PORT || 3013;
app.listen(PORT, () => console.log(`UserInfo service running on port ${PORT}`));