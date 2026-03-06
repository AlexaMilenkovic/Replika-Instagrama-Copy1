process.env.NODE_ENV = 'test';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

/* ---------- SHARED MOCKS ---------- */

const mockExecute = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: () => ({ execute: mockExecute }),
}));

/* ---------- IMPORTS ---------- */

const request = require('supertest');
const jwt = require('jsonwebtoken');

const makeToken = (id = 1) =>
  jwt.sign({ id, username: 'testuser' }, process.env.JWT_SECRET || 'secret');

const mockPost = {
  id: 10, caption: 'Hello world', created_at: new Date(), updated_at: new Date(),
  likes_count: 3, comments_count: 1
};

const mockMedia = [
  { id: 1, post_id: 10, media_url: 'http://example.com/img.jpg', media_type: 'image', media_size_mb: '1.20', created_at: new Date() }
];

/* ══════════════════════════════════════════════════════════
   UserPostModel tests
══════════════════════════════════════════════════════════ */

const { getUserPosts } = require('../UserPostModel');

describe('UserPostModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should correctly group multiple media items under the same post', async () => {
    const multiMedia = [
      { id: 1, post_id: 10, media_url: 'http://example.com/img1.jpg', media_type: 'image', media_size_mb: '1.20', created_at: new Date() },
      { id: 2, post_id: 10, media_url: 'http://example.com/img2.jpg', media_type: 'image', media_size_mb: '2.00', created_at: new Date() },
      { id: 3, post_id: 10, media_url: 'http://example.com/vid.mp4',  media_type: 'video', media_size_mb: '5.00', created_at: new Date() },
    ];

    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])  // user found
      .mockResolvedValueOnce([[]])                            // no block
      .mockResolvedValueOnce([[mockPost]])                    // posts
      .mockResolvedValueOnce([multiMedia]);                   // 3 media for same post

    const result = await getUserPosts(2, 1);
    expect(result.data[0].media).toHaveLength(3);
  });

  it('should return 404 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const result = await getUserPosts(999, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return 404 if requester is blocked', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[{ 1: 1 }]]);
    const result = await getUserPosts(2, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return 403 if profile is private and requester is not following', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserPosts(2, 1);
    expect(result).toEqual({ error: 'This profile is private', status: 403 });
  });

  it('should return empty array if user has no posts', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserPosts(2, 1);
    expect(result).toEqual({ data: [] });
  });

  it('should return posts with media grouped by post', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[mockPost]])
      .mockResolvedValueOnce([mockMedia]);
    const result = await getUserPosts(2, 1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].media).toHaveLength(1);
    expect(result.data[0].likes_count).toBe(3);
  });

  it('should return posts with empty media if no media exists', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[mockPost]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserPosts(2, 1);
    expect(result.data[0].media).toHaveLength(0);
  });

  it('should skip privacy check if requester views own profile', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 1, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserPosts(1, 1);
    expect(result).toEqual({ data: [] });
  });

  it('should return posts if private profile and requester is following', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ 1: 1 }]])
      .mockResolvedValueOnce([[mockPost]])
      .mockResolvedValueOnce([mockMedia]);
    const result = await getUserPosts(2, 1);
    expect(result.data).toHaveLength(1);
  });

  it('should throw if database fails', async () => {
    mockExecute.mockRejectedValue(new Error('DB error'));
    await expect(getUserPosts(2, 1)).rejects.toThrow('DB error');
  });
});

/* ══════════════════════════════════════════════════════════
   UserPostController tests
══════════════════════════════════════════════════════════ */

const app = require('../UserPostController');

describe('UserPostController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'userPosts' });
    });
  });

  describe('GET /users/:userId/posts - auth', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/users/2/posts');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access token missing');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('GET /users/:userId/posts - validation', () => {
    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/users/abc/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('GET /users/:userId/posts - results', () => {
    it('should return 404 if user not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/999/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 404 if requester is blocked', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
        .mockResolvedValueOnce([[{ 1: 1 }]]);
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 for private profile if not following', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('This profile is private');
    });

    it('should return posts with media for public profile', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[mockPost]])
        .mockResolvedValueOnce([mockMedia]);
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].media).toHaveLength(1);
      expect(res.body.posts[0].likes_count).toBe(3);
    });

    it('should return empty array if user has no posts', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(0);
    });

    it('should return 500 if database throws', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .get('/users/2/posts')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   UserPostServer tests
══════════════════════════════════════════════════════════ */

describe('UserPostServer', () => {
  it('should start and listen on a port', (done) => {
    const server = require('../UserPostController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});