module.exports = {
  authentication: process.env.AUTH_SERVICE_URL      || 'http://authentication:3001',
  profile:        process.env.PROFILE_SERVICE_URL   || 'http://profile:3010',
  'user-follows': process.env.USER_FOLLOWING_SERVICE_URL || 'http://user-follows:3011',
  'users-following': process.env.USER_FOLLOWERS_SERVICE_URL || 'http://users-following:3012',
  'user-posts':   process.env.USER_POSTS_SERVICE_URL || 'http://user-posts:3014',
  feed:           process.env.FEED_SERVICE_URL      || 'http://feed:3015',
  'follow-service': process.env.FOLLOW_SERVICE_URL  || 'http://follow-service:3004',
  post:           process.env.POST_SERVICE_URL      || 'http://post-service:3006',
};