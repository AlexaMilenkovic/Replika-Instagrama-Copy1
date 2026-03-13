// Učitavanje modula
const express = require('express');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Middleware-i
const authMiddleware = require('./middleware/authMiddleware');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Konfiguracija servisa
const services = require('./config/services');

// Učitavanje .env promenljivih
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware za autentikaciju i ograničavanje zahteva
app.use(authMiddleware);
app.use(rateLimiter);

// Proxy rute
Object.entries(services).forEach(([serviceName, serviceUrl]) => {
    app.use(`/api/${serviceName}`, createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: { [`^/api/${serviceName}`]: '' }
    }));
});

// Centralizovana obrada grešaka
app.use(errorHandler);

// Startovanje servera
app.listen(PORT, () => {
    console.log(`API Gateway radi na portu ${PORT}`);
});