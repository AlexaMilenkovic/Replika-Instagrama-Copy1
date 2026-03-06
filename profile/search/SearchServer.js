const app = require('./searchController');

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Search service running on port ${PORT}`));