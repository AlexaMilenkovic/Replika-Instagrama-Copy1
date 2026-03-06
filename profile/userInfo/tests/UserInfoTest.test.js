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

const mockUser = {
  id: 2, first_name: 'John', last_name: 'Doe', username: 'johndoe',
  bio: 'Hello!', profile_image_url: null, is_private: 0, created_at: new Date()
};

/* ══════════════════════════════════════════════════════════
   UserInfoModel tests
══════════════════════════════════════════════════════════ */

const { getUserInfo } = require('../UserInfoModel');

describe('UserInfoModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 404 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const result = await getUserInfo(999, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return 404 if requester is blocked', async () => {
    mockExecute
      .mockResolvedValueOnce([[mockUser]])
      .mockResolvedValueOnce([[{ 1: 1 }]]);
    const result = await getUserInfo(2, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return full user info with counts and is_following false', async () => {
    mockExecute
      .mockResolvedValueOnce([[mockUser]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ followers_count: 10 }]])
      .mockResolvedValueOnce([[{ following_count: 5 }]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserInfo(2, 1);
    expect(result.data.username).toBe('johndoe');
    expect(result.data.followers_count).toBe(10);
    expect(result.data.following_count).toBe(5);
    expect(result.data.is_following).toBe(false);
    expect(result.data.is_private).toBe(false);
  });

  it('should return is_following true when requester follows user', async () => {
    mockExecute
      .mockResolvedValueOnce([[mockUser]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ followers_count: 3 }]])
      .mockResolvedValueOnce([[{ following_count: 2 }]])
      .mockResolvedValueOnce([[{ 1: 1 }]]);
    const result = await getUserInfo(2, 1);
    expect(result.data.is_following).toBe(true);
  });

  it('should return is_private true when user is private', async () => {
    const privateUser = { ...mockUser, is_private: 1 };
    mockExecute
      .mockResolvedValueOnce([[privateUser]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ followers_count: 0 }]])
      .mockResolvedValueOnce([[{ following_count: 0 }]])
      .mockResolvedValueOnce([[]]);
    const result = await getUserInfo(2, 1);
    expect(result.data.is_private).toBe(true);
  });

  it('should throw if database fails', async () => {
    mockExecute.mockRejectedValue(new Error('DB error'));
    await expect(getUserInfo(2, 1)).rejects.toThrow('DB error');
  });
});

/* ══════════════════════════════════════════════════════════
   UserInfoController tests
══════════════════════════════════════════════════════════ */

const app = require('../UserInfoController');

describe('UserInfoController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'userInfo' });
    });
  });

  describe('GET /users/:userId - auth', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/users/2');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access token missing');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/users/2')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('GET /users/:userId - validation', () => {
    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/users/abc')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('GET /users/:userId - results', () => {
    it('should return 404 if user not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/999')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 404 if requester is blocked', async () => {
      mockExecute
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([[{ 1: 1 }]]);
      const res = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
    });

    it('should return full user info for public profile', async () => {
      mockExecute
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ followers_count: 10 }]])
        .mockResolvedValueOnce([[{ following_count: 5 }]])
        .mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('johndoe');
      expect(res.body.user.followers_count).toBe(10);
      expect(res.body.user.following_count).toBe(5);
      expect(res.body.user.is_following).toBe(false);
    });

    it('should return is_following true when requester follows user', async () => {
      mockExecute
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ followers_count: 3 }]])
        .mockResolvedValueOnce([[{ following_count: 2 }]])
        .mockResolvedValueOnce([[{ 1: 1 }]]);
      const res = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.user.is_following).toBe(true);
    });

    it('should return 500 if database throws', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .get('/users/2')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   UserInfoServer tests
══════════════════════════════════════════════════════════ */

describe('UserInfoServer', () => {
  it('should start and listen on a port', (done) => {
    const server = require('../UserInfoController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});