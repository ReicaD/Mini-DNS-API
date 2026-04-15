require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const dnsService = require('./services/dnsService');

// Verify Environment Variables
if (!process.env.MONGO_URI && process.env.NODE_ENV !== 'test') {
  console.error('[CRITICAL] MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

// Connect to Database
connectDB();

// Start TTL Background Job (Internal logic for record expiration)
dnsService.startTTLJob();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Mini-DNS] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = server;
