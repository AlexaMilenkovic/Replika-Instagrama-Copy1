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

/* ══════════════════════════════════════════════════════════
   UserFollowersModel tests
══════════════════════════════════════════════════════════ */

const { getFollowers } = require('../UserFollowersModel');

describe('UserFollowersModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 404 if user not found', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const result = await getFollowers(999, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return 404 if requester is blocked', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[{ 1: 1 }]]);
    const result = await getFollowers(2, 1);
    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('should return 403 if profile is private and requester is not following', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);
    const result = await getFollowers(2, 1);
    expect(result).toEqual({ error: 'This profile is private', status: 403 });
  });

  it('should return followers if profile is private and requester is following', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ 1: 1 }]])
      .mockResolvedValueOnce([[
        { id: 5, first_name: 'Alice', last_name: 'Smith', username: 'alice', profile_image_url: null, is_private: 0 }
      ]]);
    const result = await getFollowers(2, 1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].username).toBe('alice');
  });

  it('should return followers for public profile', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        { id: 5, first_name: 'Alice', last_name: 'Smith', username: 'alice', profile_image_url: null, is_private: 0 }
      ]]);
    const result = await getFollowers(2, 1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].username).toBe('alice');
  });

  it('should return empty followers list for public profile with no followers', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);
    const result = await getFollowers(2, 1);
    expect(result.data).toHaveLength(0);
  });

  it('should skip privacy check if requester is viewing own profile', async () => {
    mockExecute
      .mockResolvedValueOnce([[{ id: 1, is_private: 1 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        { id: 5, first_name: 'Alice', last_name: 'Smith', username: 'alice', profile_image_url: null, is_private: 0 }
      ]]);
    const result = await getFollowers(1, 1); // same userId and requesterId
    expect(result.data).toHaveLength(1);
  });

  it('should throw if database fails', async () => {
    mockExecute.mockRejectedValue(new Error('DB error'));
    await expect(getFollowers(2, 1)).rejects.toThrow('DB error');
  });
});

/* ══════════════════════════════════════════════════════════
   UserFollowersController tests
══════════════════════════════════════════════════════════ */

const app = require('../UserFollowersController');

describe('UserFollowersController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'userFollowers' });
    });
  });

  describe('GET /users/:userId/followers - auth', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/users/2/followers');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access token missing');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/users/2/followers')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('GET /users/:userId/followers - validation', () => {
    it('should return 400 for invalid user ID', async () => {
      const res = await request(app)
        .get('/users/abc/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid user ID');
    });
  });

  describe('GET /users/:userId/followers - results', () => {
    it('should return 404 if user not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/999/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 404 if requester is blocked', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
        .mockResolvedValueOnce([[{ 1: 1 }]]);
      const res = await request(app)
        .get('/users/2/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 for private profile if not following', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 1 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);
      const res = await request(app)
        .get('/users/2/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('This profile is private');
    });

    it('should return followers for public profile', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ id: 2, is_private: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[
          { id: 5, first_name: 'Alice', last_name: 'Smith', username: 'alice', profile_image_url: null, is_private: 0 }
        ]]);
      const res = await request(app)
        .get('/users/2/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(200);
      expect(res.body.followers).toHaveLength(1);
      expect(res.body.followers[0].username).toBe('alice');
    });

    it('should return 500 if database throws', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .get('/users/2/followers')
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   UserFollowersServer tests
══════════════════════════════════════════════════════════ */

describe('UserFollowersServer', () => {
  it('should start and listen on a port', (done) => {
    const server = require('../UserFollowersController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});