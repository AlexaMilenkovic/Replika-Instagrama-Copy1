const db = require('../config/db');

const FollowModel = {
    //  Slanje zahteva za praćenje
    async createFollow(followerId, followingId, status) {
        const query = 'INSERT INTO follows (follower_id, following_id, status) VALUES (?, ?, ?)';
        return db.query(query, [followerId, followingId, status]);
    },

    // Za prihvatanje zahteva (Menjamo status)
    async updateFollowStatus(followerId, followingId, newStatus) {
        const query = 'UPDATE follows SET status = ? WHERE follower_id = ? AND following_id = ?';
        return db.query(query, [newStatus, followerId, followingId]);
    },

    // Za "Notifikacije" - lista svih koji čekaju odobrenje
    async getPendingRequests(userId) {
        const query = 'SELECT follower_id, created_at FROM follows WHERE following_id = ? AND status = "PENDING"';
        const [rows] = await db.query(query, [userId]);
        return rows;
    },

    //  Otpraćivanje ili uklanjanje pratioca i odbijanje zahteva
    async deleteFollow(followerId, followingId) {
        const query = 'DELETE FROM follows WHERE follower_id = ? AND following_id = ?';
        return db.query(query, [followerId, followingId]);
    },

    //  Blokiranje (dodavanje u tabelu blocks)
    async createBlock(blockerId, blockedId) {
        const query = 'INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)';
        return db.query(query, [blockerId, blockedId]);
    },

    //  Automatsko "otpraćivanje" prilikom blokiranja (uklanja oba smera)
    async removeFollowsOnBlock(userA, userB) {
        const query = 'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)';
        return db.query(query, [userA, userB, userB, userA]);
    },

    //  Broj pratilaca i profil koji prate
    async getFollowStats(userId) {
        const followersQuery = 'SELECT COUNT(*) as count FROM follows WHERE following_id = ? AND status = "ACCEPTED"';
        const followingQuery = 'SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND status = "ACCEPTED"';
        
        const [followers] = await db.query(followersQuery, [userId]);
        const [following] = await db.query(followingQuery, [userId]);
        
        return {
            followers: followers[0].count,
            following: following[0].count
        };
    }
};

module.exports = FollowModel;