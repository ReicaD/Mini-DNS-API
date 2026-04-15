const express = require('express');
const dnsRoutes = require('./routes/dnsRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/dns', dnsRoutes);

// Basic Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is up and running!' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || 400;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
