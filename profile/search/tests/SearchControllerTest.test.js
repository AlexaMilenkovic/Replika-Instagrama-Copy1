process.env.NODE_ENV = 'test';

const request = require('supertest');

jest.mock('node-fetch');
const fetch = require('node-fetch');

jest.mock('../searchModel');
const { searchUsers: mockSearchUsers } = require('../searchModel');

const app = require('../searchController');

const mockAuthSuccess = (user = { id: 1, username: 'testuser' }) => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: 'Access granted', user }),
  });
};

const mockAuthFail = () => {
  fetch.mockResolvedValue({
    ok: false,
    json: async () => ({ message: 'Unauthorized' }),
  });
};

describe('SearchController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'search' });
    });
  });

  describe('GET /search - auth', () => {
    it('should return 401 with default message if auth service returns no message', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: async () => ({}), // no message field
      });

      const res = await request(app)
        .get('/search?q=john')
        .set('Authorization', 'Bearer badtoken');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/search?q=john');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Access token missing');
    });

    it('should return 401 if auth service rejects token', async () => {
      mockAuthFail();
      const res = await request(app)
        .get('/search?q=john')
        .set('Authorization', 'Bearer badtoken');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 503 if auth service is unreachable', async () => {
      fetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const res = await request(app)
        .get('/search?q=john')
        .set('Authorization', 'Bearer validtoken');
      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Authentication service unavailable');
    });
  });

  describe('GET /search - validation', () => {
    it('should return 400 if query is missing', async () => {
      mockAuthSuccess();
      const res = await request(app)
        .get('/search')
        .set('Authorization', 'Bearer validtoken');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Search query is required');
    });

    it('should return 400 if query is empty string', async () => {
      mockAuthSuccess();
      const res = await request(app)
        .get('/search?q=')
        .set('Authorization', 'Bearer validtoken');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Search query is required');
    });

    it('should return 400 if query is less than 2 characters', async () => {
      mockAuthSuccess();
      const res = await request(app)
        .get('/search?q=a')
        .set('Authorization', 'Bearer validtoken');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Search query must be at least 2 characters');
    });
  });

  describe('GET /search - results', () => {
    it('should return users matching the query', async () => {
      mockAuthSuccess();
      mockSearchUsers.mockResolvedValue([
        { id: 2, first_name: 'John', last_name: 'Doe', username: 'johndoe', bio: null, profile_image_url: null, is_private: 0 }
      ]);

      const res = await request(app)
        .get('/search?q=john')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].username).toBe('johndoe');
    });

    it('should return empty array if no users found', async () => {
      mockAuthSuccess();
      mockSearchUsers.mockResolvedValue([]);

      const res = await request(app)
        .get('/search?q=nobody')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(0);
    });

    it('should trim whitespace from query before searching', async () => {
      mockAuthSuccess();
      mockSearchUsers.mockResolvedValue([]);

      await request(app)
        .get('/search?q=  john  ')
        .set('Authorization', 'Bearer validtoken');

      expect(mockSearchUsers).toHaveBeenCalledWith('john', 1);
    });

    it('should return 500 on database error', async () => {
      mockAuthSuccess();
      mockSearchUsers.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .get('/search?q=john')
        .set('Authorization', 'Bearer validtoken');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});