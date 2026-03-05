const express = require('express');
require('dotenv').config();
const db = require('./config/db');

const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

// Testna ruta provera
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.send(`Konekcija sa bazom uspešna! Rezultat: ${rows[0].result}`);
  } catch (err) {
    res.status(500).send(`Greška pri povezivanju sa bazom: ${err.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Follow servis radi na portu ${PORT}`);
});

// Rute za Praćenje (Follow) i Blokiranje (Block) 
app.post('/follow', FollowController.followUser);             // Slanje zahteva (Javni/Privatni)
app.put('/follow/accept', FollowController.acceptFollow);      // Prihvatanje zahteva 
app.delete('/follow/reject', FollowController.rejectFollow);   // Odbijanje zahteva 
app.get('/follow/notifications/:userId', FollowController.getNotifications); // Lista zahteva za meni

app.delete('/unfollow', FollowController.unfollowUser);       // Prekid praćenja 
app.post('/block', FollowController.blockUser);               // Blokiranje 
app.get('/stats/:userId', FollowController.getStats);         // Broj pratilaca i praćenih 
app.listen(PORT, () => {
  console.log(`Follow servis radi na portu ${PORT}`);
});