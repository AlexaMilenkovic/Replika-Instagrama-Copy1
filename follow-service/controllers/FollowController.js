const FollowModel = require('../models/FollowModel');

const FollowController = {
    //  Zapraćivanje
    async followUser(req, res) {
        const { follower_id, following_id, isPrivate } = req.body;

        //  provera (da ne prati samog sebe)
        if (follower_id === following_id) {
            return res.status(400).json({ error: "Ne možete pratiti sami sebe." });
        }

        try {
            // ako je privatan 'PENDING', ako je javan 'ACCEPTED'
            const status = isPrivate ? 'PENDING' : 'ACCEPTED';
            
            await FollowModel.createFollow(follower_id, following_id, status);
            
            res.status(201).json({ 
                message: isPrivate ? "Zahtev za praćenje poslat (na čekanju)." : "Uspešno zapraćeno.",
                status: status 
            });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Već postoji zahtev ili veza praćenja." });
            }
            res.status(500).json({ error: err.message });
        }
    },

    //  Otpraćivanje (poništivost s obe strane)
    async unfollowUser(req, res) {
        const { follower_id, following_id } = req.body;

        try {
            await FollowModel.deleteFollow(follower_id, following_id);
            res.status(200).json({ message: "Veza praćenja je prekinuta." });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    //  Blokiranje
    async blockUser(req, res) {
        const { blocker_id, blocked_id } = req.body;

        try {
            // Upisujemo blokadu u tabelu blocks
            await FollowModel.createBlock(blocker_id, blocked_id);
            
            // Automatsko "otpraćivanje" u oba smera 
            await FollowModel.removeFollowsOnBlock(blocker_id, blocked_id);
            
            res.status(201).json({ message: "Korisnik je blokiran i sve veze praćenja su obrisane." });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "Korisnik je već blokiran." });
            }
            res.status(500).json({ error: err.message });
        }
    },

    // Broj pratilaca i onih koje profil prati
    async getStats(req, res) {
        const { userId } = req.params;

        try {
            const stats = await FollowModel.getFollowStats(userId);
            res.status(200).json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = FollowController;