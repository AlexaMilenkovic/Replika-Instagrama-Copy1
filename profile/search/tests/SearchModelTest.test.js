process.env.NODE_ENV = 'test';

const mockExecute = jest.fn();

jest.mock('mysql2/promise', () => ({
  createPool: () => ({
    execute: mockExecute,
  }),
}));

const { searchUsers } = require('../searchModel');

describe('SearchModel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return users matching query', async () => {
    mockExecute.mockResolvedValue([[
      { id: 2, first_name: 'John', last_name: 'Doe', username: 'johndoe', bio: null, profile_image_url: null, is_private: 0 }
    ]]);

    const result = await searchUsers('john', 1);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('johndoe');
  });

  it('should return empty array if no users match', async () => {
    mockExecute.mockResolvedValue([[]]);

    const result = await searchUsers('nobody', 1);
    expect(result).toHaveLength(0);
  });

  it('should pass correct LIKE parameters to query', async () => {
    mockExecute.mockResolvedValue([[]]);

    await searchUsers('test', 5);

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
      ['%test%', '%test%', '%test%', 5, 5]
    );
  });

  it('should throw if database query fails', async () => {
    mockExecute.mockRejectedValue(new Error('DB connection lost'));

    await expect(searchUsers('john', 1)).rejects.toThrow('DB connection lost');
  });
});