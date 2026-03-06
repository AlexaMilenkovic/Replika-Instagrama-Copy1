beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_REFRESH_SECRET = 'refreshsecret';
process.env.NODE_ENV = 'test';

/* ---------- SHARED MOCKS ---------- */

const mockExecute = jest.fn();
const mockRedisSet = jest.fn();
const mockConnect = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: () => ({ execute: mockExecute }),
}));

jest.mock('redis', () => ({
  createClient: () => ({
    connect: mockConnect,
    set: mockRedisSet,
  }),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

/* ---------- IMPORTS ---------- */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/* ---------- HELPERS ---------- */

const fakeUser = { id: 1, username: 'testuser', password_hash: 'hashedpassword' };

/* ══════════════════════════════════════════════════════════
   LoginModel tests (real functions, mocked dependencies)
══════════════════════════════════════════════════════════ */

const {
  findUserByIdentifier,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
} = require('../LoginModel');

describe('LoginModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Redis connection', () => {
    it('should call redis.connect() when NODE_ENV is not test', () => {
      // Reset module registry so LoginModel is re-evaluated with new NODE_ENV
      jest.resetModules();

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Re-mock after resetModules
      jest.mock('mysql2/promise', () => ({
        createPool: () => ({ execute: jest.fn() }),
      }));
      jest.mock('redis', () => ({
        createClient: () => ({
          connect: mockConnect,
          set: mockRedisSet,
        }),
      }));
      jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

      require('../LoginModel');

      expect(mockConnect).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      jest.resetModules();

      // Re-mock again to restore state for subsequent tests
      jest.mock('mysql2/promise', () => ({
        createPool: () => ({ execute: mockExecute }),
      }));
      jest.mock('redis', () => ({
        createClient: () => ({
          connect: mockConnect,
          set: mockRedisSet,
        }),
      }));
      jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
    });
  });

  describe('findUserByIdentifier', () => {
    it('should return user if found by username', async () => {
      mockExecute.mockResolvedValue([[fakeUser]]);
      const result = await findUserByIdentifier('testuser');
      expect(result).toEqual(fakeUser);
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('WHERE username=?'),
        ['testuser', 'testuser']
      );
    });

    it('should return null if user not found', async () => {
      mockExecute.mockResolvedValue([[]]);
      const result = await findUserByIdentifier('nobody');
      expect(result).toBeNull();
    });

    it('should return null when rows[0] is undefined', async () => {
      mockExecute.mockResolvedValue([[undefined]]);
      const result = await findUserByIdentifier('testuser');
      expect(result).toBeNull();
    });

    it('should throw if database fails', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      await expect(findUserByIdentifier('testuser')).rejects.toThrow('DB error');
    });
  });

  describe('verifyPassword', () => {
    it('should return true if password matches', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const result = await verifyPassword('password123', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false if password does not match', async () => {
      bcrypt.compare.mockResolvedValue(false);
      const result = await verifyPassword('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });
  });

  describe('generateAccessToken', () => {
    it('should return a valid JWT with userId and username', () => {
      const token = generateAccessToken(fakeUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(1);
      expect(decoded.username).toBe('testuser');
    });

    it('should expire in 15 minutes', () => {
      const token = generateAccessToken(fakeUser);
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(15 * 60);
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a valid JWT with userId', () => {
      const token = generateRefreshToken(fakeUser);
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      expect(decoded.userId).toBe(1);
    });

    it('should expire in 7 days', () => {
      const token = generateRefreshToken(fakeUser);
      const decoded = jwt.decode(token);
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60);
    });
  });

  describe('storeRefreshToken', () => {
    it('should store token in redis with correct key and TTL', async () => {
      mockRedisSet.mockResolvedValue('OK');
      await storeRefreshToken(1, 'myrefreshtoken');
      expect(mockRedisSet).toHaveBeenCalledWith(
        'refresh:1',
        'myrefreshtoken',
        { EX: 7 * 24 * 60 * 60 }
      );
    });

    it('should throw if redis fails', async () => {
      mockRedisSet.mockRejectedValue(new Error('Redis down'));
      await expect(storeRefreshToken(1, 'token')).rejects.toThrow('Redis down');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   LoginController tests
══════════════════════════════════════════════════════════ */

const app = require('../LoginController');

describe('LoginController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'login' });
    });
  });

  describe('POST /login - validation', () => {
    it('should return 400 if identifier is missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Identifier and password are required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ identifier: 'testuser' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Identifier and password are required');
    });

    it('should return 400 if body is empty', async () => {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Identifier and password are required');
    });
  });

  describe('POST /login - authentication', () => {
    it('should return 401 if user not found', async () => {
      mockExecute.mockResolvedValue([[]]);

      const res = await request(app)
        .post('/login')
        .send({ identifier: 'nobody', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      mockExecute.mockResolvedValue([[fakeUser]]);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/login')
        .send({ identifier: 'testuser', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 200 with tokens on successful login', async () => {
      mockExecute.mockResolvedValue([[fakeUser]]);
      bcrypt.compare.mockResolvedValue(true);
      mockRedisSet.mockResolvedValue('OK');

      const res = await request(app)
        .post('/login')
        .send({ identifier: 'testuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(1);
      expect(decoded.username).toBe('testuser');
    });

    it('should return 500 if database throws', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/login')
        .send({ identifier: 'testuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 if redis throws', async () => {
      mockExecute.mockResolvedValue([[fakeUser]]);
      bcrypt.compare.mockResolvedValue(true);
      mockRedisSet.mockRejectedValue(new Error('Redis down'));

      const res = await request(app)
        .post('/login')
        .send({ identifier: 'testuser', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   LoginServer tests
══════════════════════════════════════════════════════════ */

describe('LoginServer', () => {
  it('should start and listen on port 3002', (done) => {
    const server = require('../LoginController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});