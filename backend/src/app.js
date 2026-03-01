const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const carrierRoutes = require('./routes/carrierRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ── Health Check ──
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api', carrierRoutes);
app.use('/api', shipmentRoutes);

// ── 404 Handler ──
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.url} not found` });
});

// ── Global Error Handler ──
app.use(errorHandler);

module.exports = app;
