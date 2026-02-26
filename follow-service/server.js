const express = require('express');
require('dotenv').config();
const db = require('./config/db');

const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

// Testna ruta 
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