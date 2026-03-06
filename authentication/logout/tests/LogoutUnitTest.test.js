process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

/* ---------- SHARED MOCKS ---------- */

const mockSet = jest.fn();
const mockDel = jest.fn();
const mockConnect = jest.fn();

jest.mock('redis', () => ({
  createClient: () => ({
    connect: mockConnect,
    set: mockSet,
    del: mockDel,
  }),
}));

/* ---------- IMPORTS ---------- */

const request = require('supertest');
const jwt = require('jsonwebtoken');

/* ══════════════════════════════════════════════════════════
   LogoutModel tests
══════════════════════════════════════════════════════════ */

const { blacklistAccessToken, deleteRefreshToken } = require('../LogoutModel');

describe('LogoutModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Redis connection', () => {
    it('should call redis.connect() when NODE_ENV is not test', () => {
      jest.resetModules();

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.mock('redis', () => ({
        createClient: () => ({
          connect: mockConnect,
          set: mockSet,
          del: mockDel,
        }),
      }));

      require('../LogoutModel');
      expect(mockConnect).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      jest.resetModules();

      jest.mock('redis', () => ({
        createClient: () => ({
          connect: mockConnect,
          set: mockSet,
          del: mockDel,
        }),
      }));
    });
  });

  describe('blacklistAccessToken', () => {
    it('should call redis.set with correct key, value and TTL', async () => {
      mockSet.mockResolvedValue('OK');
      await blacklistAccessToken('mytoken', 900);
      expect(mockSet).toHaveBeenCalledWith('blacklist:mytoken', 'true', { EX: 900 });
    });

    it('should throw if redis.set fails', async () => {
      mockSet.mockRejectedValue(new Error('Redis down'));
      await expect(blacklistAccessToken('mytoken', 900)).rejects.toThrow('Redis down');
    });
  });

  describe('deleteRefreshToken', () => {
    it('should call redis.del with correct key', async () => {
      mockDel.mockResolvedValue(1);
      await deleteRefreshToken(1);
      expect(mockDel).toHaveBeenCalledWith('refresh:1');
    });

    it('should throw if redis.del fails', async () => {
      mockDel.mockRejectedValue(new Error('Redis down'));
      await expect(deleteRefreshToken(1)).rejects.toThrow('Redis down');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   LogoutController tests
══════════════════════════════════════════════════════════ */

const app = require('../LogoutController');

describe('LogoutController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'logout' });
    });
  });

  describe('POST /logout - validation', () => {
    it('should return 400 if token is missing', async () => {
      const res = await request(app).post('/logout').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token required');
    });

    it('should return 400 if token is malformed and cannot be decoded', async () => {
      const res = await request(app)
        .post('/logout')
        .set('Authorization', 'Bearer notavalidtoken')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid token');
    });
  });

  describe('POST /logout - success', () => {
    it('should logout with access token only', async () => {
      mockSet.mockResolvedValue('OK');
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });

      const res = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out');
      expect(mockSet).toHaveBeenCalledWith(
        `blacklist:${token}`,
        'true',
        expect.objectContaining({ EX: expect.any(Number) })
      );
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('should logout and delete refresh token when refreshToken is provided', async () => {
      mockSet.mockResolvedValue('OK');
      mockDel.mockResolvedValue(1);

      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });

      const res = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out');
      expect(mockSet).toHaveBeenCalled();
      expect(mockDel).toHaveBeenCalledWith('refresh:1');
    });

    it('should logout without deleting refresh token if refreshToken payload has no userId', async () => {
      mockSet.mockResolvedValue('OK');

      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ noUserId: true }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(mockDel).not.toHaveBeenCalled();
    });
  });

  describe('POST /logout - errors', () => {
    it('should return 500 if redis.set throws', async () => {
      mockSet.mockRejectedValue(new Error('Redis down'));

      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });

      const res = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 if redis.del throws', async () => {
      mockSet.mockResolvedValue('OK');
      mockDel.mockRejectedValue(new Error('Redis down'));

      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '7d' });

      const res = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   LogoutServer tests
══════════════════════════════════════════════════════════ */

describe('LogoutServer', () => {
  it('should start and listen on a port', (done) => {
    const server = require('../LogoutController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});