jest.mock('../models/FollowModel', () => ({
  isBlocked: jest.fn(),
  findFollow: jest.fn(),
  createFollow: jest.fn(),
  acceptPendingFollow: jest.fn(),
  rejectPendingFollow: jest.fn(),
  deleteFollow: jest.fn(),
  getPendingRequests: jest.fn(),
  createBlock: jest.fn(),
  removeFollowsOnBlock: jest.fn(),
  getFollowStats: jest.fn(),
  getFollowStatus: jest.fn()
}));

const FollowModel = require('../models/FollowModel');
const FollowController = require('../controllers/FollowController');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('FollowController - unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------
  // followUser
  // --------------------
  describe('followUser', () => {
    test('400 ako fali follower_id ili following_id', async () => {
      const req = { body: { }, headers: {} }; // nema ni following_id ni x-user-id
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });

    test('400 ako korisnik prati samog sebe', async () => {
      const req = { body: { following_id: '1' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('403 ako postoji blok između korisnika', async () => {
      FollowModel.isBlocked.mockResolvedValue(true);

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(FollowModel.isBlocked).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('400 ako follow relacija već postoji', async () => {
      FollowModel.isBlocked.mockResolvedValue(false);
      FollowModel.findFollow.mockResolvedValue({ follower_id: '1', following_id: '2' });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(FollowModel.findFollow).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('kreira PENDING ako je profil privatan', async () => {
      FollowModel.isBlocked.mockResolvedValue(false);
      FollowModel.findFollow.mockResolvedValue(null);

      const spy = jest
        .spyOn(FollowController, 'getProfilePrivacyStatus')
        .mockResolvedValue(true);

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(spy).toHaveBeenCalledWith('2', req);
      expect(FollowModel.createFollow).toHaveBeenCalledWith('1', '2', 'PENDING');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('kreira ACCEPTED ako je profil javan', async () => {
      FollowModel.isBlocked.mockResolvedValue(false);
      FollowModel.findFollow.mockResolvedValue(null);

      const spy = jest
        .spyOn(FollowController, 'getProfilePrivacyStatus')
        .mockResolvedValue(false);

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(FollowModel.createFollow).toHaveBeenCalledWith('1', '2', 'ACCEPTED');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // --------------------
  // acceptFollow
  // --------------------
  describe('acceptFollow', () => {
    test('200 ako je pending zahtev uspešno prihvaćen', async () => {
      FollowModel.acceptPendingFollow.mockResolvedValue({ affectedRows: 1 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.acceptFollow(req, res);

      expect(FollowModel.acceptPendingFollow).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('404 ako pending zahtev ne postoji', async () => {
      FollowModel.acceptPendingFollow.mockResolvedValue({ affectedRows: 0 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.acceptFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --------------------
  // rejectFollow
  // --------------------
  describe('rejectFollow', () => {
    test('200 ako je pending zahtev uspešno odbijen', async () => {
      FollowModel.rejectPendingFollow.mockResolvedValue({ affectedRows: 1 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.rejectFollow(req, res);

      expect(FollowModel.rejectPendingFollow).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('404 ako pending zahtev ne postoji', async () => {
      FollowModel.rejectPendingFollow.mockResolvedValue({ affectedRows: 0 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.rejectFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --------------------
  // getNotifications
  // --------------------
  describe('getNotifications', () => {
    test('200 vraća listu pending zahteva', async () => {
      FollowModel.getPendingRequests.mockResolvedValue([{ follower_id: '5' }]);

      const req = { headers: { 'x-user-id': '2' } }; // userId iz headera
      const res = mockRes();

      await FollowController.getNotifications(req, res);

      expect(FollowModel.getPendingRequests).toHaveBeenCalledWith('2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pending_requests: [{ follower_id: '5' }] });
    });
  });

  // --------------------
  // unfollowUser
  // --------------------
  describe('unfollowUser', () => {
    test('200 ako je otpraćivanje uspelo', async () => {
      FollowModel.deleteFollow.mockResolvedValue({ affectedRows: 1 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.unfollowUser(req, res);

      expect(FollowModel.deleteFollow).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('404 ako veza praćenja ne postoji', async () => {
      FollowModel.deleteFollow.mockResolvedValue({ affectedRows: 0 });

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.unfollowUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --------------------
  // removeFollower
  // --------------------
  describe('removeFollower', () => {
    test('200 ako je pratilac uklonjen', async () => {
      FollowModel.deleteFollow.mockResolvedValue({ affectedRows: 1 });

      const req = { body: { follower_id: '1' }, headers: { 'x-user-id': '2' } }; // vlasnik iz headera
      const res = mockRes();

      await FollowController.removeFollower(req, res);

      expect(FollowModel.deleteFollow).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // --------------------
  // blockUser
  // --------------------
  describe('blockUser', () => {
    test('400 ako fali blocker_id ili blocked_id', async () => {
      const req = { body: { }, headers: {} }; // nema ni blocked_id ni x-user-id
      const res = mockRes();

      await FollowController.blockUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 ako korisnik blokira samog sebe', async () => {
      const req = { body: { blocked_id: '1' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.blockUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('201 ako blok uspe i follow veze se obrišu', async () => {
      FollowModel.createBlock.mockResolvedValue({});
      FollowModel.removeFollowsOnBlock.mockResolvedValue({});

      const req = { body: { blocked_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.blockUser(req, res);

      expect(FollowModel.createBlock).toHaveBeenCalledWith('1', '2');
      expect(FollowModel.removeFollowsOnBlock).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('400 ako je korisnik već blokiran (ER_DUP_ENTRY)', async () => {
      FollowModel.createBlock.mockRejectedValue({ code: 'ER_DUP_ENTRY' });

      const req = { body: { blocked_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.blockUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // --------------------
  // getStats
  // --------------------
  describe('getStats', () => {
    test('200 vraća followers/following', async () => {
      FollowModel.getFollowStats.mockResolvedValue({ followers: 3, following: 10 });

      const req = { headers: { 'x-user-id': '7' } }; // userId iz headera
      const res = mockRes();

      await FollowController.getStats(req, res);

      expect(FollowModel.getFollowStats).toHaveBeenCalledWith('7');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ followers: 3, following: 10 });
    });
  });

  // --------------------
  // getBlockStatus
  // --------------------
  describe('getBlockStatus', () => {
    test('200 vraća blocked true/false', async () => {
      FollowModel.isBlocked.mockResolvedValue(true);

      const req = { query: { userB: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.getBlockStatus(req, res);

      expect(FollowModel.isBlocked).toHaveBeenCalledWith('1', '2');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ blocked: true });
    });
  });

  // --------------------
  // getRelationshipStatus
  // --------------------
  describe('getRelationshipStatus', () => {
    test('200 vraća blocked + followStatus', async () => {
      FollowModel.isBlocked.mockResolvedValue(false);
      FollowModel.getFollowStatus.mockResolvedValue('ACCEPTED');

      const req = { query: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.getRelationshipStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ blocked: false, followStatus: 'ACCEPTED' });
    });
  });

  // Error grane
  describe('FollowController - testovi za error grane', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    function mockRes() {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    }

    test('followUser -> 500 ako model baci grešku (npr. createFollow)', async () => {
      FollowModel.isBlocked.mockResolvedValue(false);
      FollowModel.findFollow.mockResolvedValue(null);
      jest.spyOn(FollowController, 'getProfilePrivacyStatus').mockResolvedValue(false);
      FollowModel.createFollow.mockRejectedValue(new Error('DB fail'));

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('acceptFollow -> 500 ako model baci grešku', async () => {
      FollowModel.acceptPendingFollow.mockRejectedValue(new Error('DB fail'));

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.acceptFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('rejectFollow -> 500 ako model baci grešku', async () => {
      FollowModel.rejectPendingFollow.mockRejectedValue(new Error('DB fail'));

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.rejectFollow(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('unfollowUser -> 500 ako model baci grešku', async () => {
      FollowModel.deleteFollow.mockRejectedValue(new Error('DB fail'));

      const req = { body: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.unfollowUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('getStats -> 500 ako model baci grešku', async () => {
      FollowModel.getFollowStats.mockRejectedValue(new Error('DB fail'));

      const req = { headers: { 'x-user-id': '7' } };
      const res = mockRes();

      await FollowController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('getNotifications -> 500 ako model baci grešku', async () => {
      FollowModel.getPendingRequests.mockRejectedValue(new Error('DB fail'));
      const req = { headers: { 'x-user-id': '2' } };
      const res = mockRes();
      await FollowController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('getRelationshipStatus -> 500 ako model baci grešku', async () => {
      FollowModel.isBlocked.mockRejectedValue(new Error('DB fail'));

      const req = { query: { following_id: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.getRelationshipStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });

    test('getBlockStatus -> 500 ako model baci grešku', async () => {
      FollowModel.isBlocked.mockRejectedValue(new Error('DB fail'));

      const req = { query: { userB: '2' }, headers: { 'x-user-id': '1' } };
      const res = mockRes();

      await FollowController.getBlockStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB fail' });
    });
  });
});