process.env.NODE_ENV = 'test';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

/* ---------- SHARED MOCKS ---------- */

const mockExecute = jest.fn();
const mockConnect = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: () => ({ execute: mockExecute }),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

/* ---------- IMPORTS ---------- */

const request = require('supertest');
const bcrypt = require('bcrypt');

/* ══════════════════════════════════════════════════════════
   RegistrationModel tests
══════════════════════════════════════════════════════════ */

const { hashPassword, createUser } = require('../RegistrationModel');

describe('RegistrationModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword');
      const result = await hashPassword('password123');
      expect(result).toBe('hashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw if bcrypt fails', async () => {
      bcrypt.hash.mockRejectedValue(new Error('bcrypt error'));
      await expect(hashPassword('password123')).rejects.toThrow('bcrypt error');
    });
  });

  describe('createUser', () => {
    it('should call pool.execute with correct parameters', async () => {
      mockExecute.mockResolvedValue([{}]);
      await createUser('John', 'Doe', 'johndoe', 'john@test.com', 'hashedpassword');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['John', 'Doe', 'johndoe', 'john@test.com', 'hashedpassword']
      );
    });

    it('should throw ER_DUP_ENTRY if user already exists', async () => {
      const error = new Error('Duplicate');
      error.code = 'ER_DUP_ENTRY';
      mockExecute.mockRejectedValue(error);
      await expect(
        createUser('John', 'Doe', 'johndoe', 'john@test.com', 'hashedpassword')
      ).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
    });

    it('should throw if database fails', async () => {
      mockExecute.mockRejectedValue(new Error('DB error'));
      await expect(
        createUser('John', 'Doe', 'johndoe', 'john@test.com', 'hashedpassword')
      ).rejects.toThrow('DB error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   RegistrationController tests
══════════════════════════════════════════════════════════ */

const app = require('../RegistrationController');

describe('RegistrationController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /health', () => {
    it('should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'registration' });
    });
  });

  describe('POST /register - validation', () => {
    it('should return 400 if all fields are missing', async () => {
      const res = await request(app).post('/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields required');
    });

    it('should return 400 if firstName is missing', async () => {
      const res = await request(app).post('/register').send({
        lastName: 'Doe', username: 'johndoe', email: 'john@test.com', password: 'password123'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields required');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/register').send({
        firstName: 'John', lastName: 'Doe', username: 'johndoe', password: 'password123'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields required');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/register').send({
        firstName: 'John', lastName: 'Doe', username: 'johndoe', email: 'john@test.com'
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('All fields required');
    });
  });

  describe('POST /register - success', () => {
    it('should register user successfully', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockExecute.mockResolvedValue([{}]);

      const res = await request(app).post('/register').send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('POST /register - errors', () => {
    it('should return 409 if user already exists', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword');
      const error = new Error('Duplicate');
      error.code = 'ER_DUP_ENTRY';
      mockExecute.mockRejectedValue(error);

      const res = await request(app).post('/register').send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('User already exists');
    });

    it('should return 500 if database throws unexpected error', async () => {
      bcrypt.hash.mockResolvedValue('hashedpassword');
      mockExecute.mockRejectedValue(new Error('DB error'));

      const res = await request(app).post('/register').send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 if bcrypt throws', async () => {
      bcrypt.hash.mockRejectedValue(new Error('bcrypt error'));

      const res = await request(app).post('/register').send({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });
  });
});

/* ══════════════════════════════════════════════════════════
   RegistrationServer tests
══════════════════════════════════════════════════════════ */

describe('RegistrationServer', () => {
  it('should start and listen on a port', (done) => {
    const server = require('../RegistrationController');
    const instance = server.listen(0, () => {
      expect(instance.listening).toBe(true);
      instance.close(done);
    });
  });
});