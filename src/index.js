const { createApp, isDocusignConfigured } = require('./app');
const { config } = require('./config');
const { closeDb, getDbPath } = require('./database');

const PORT = config.port;
const LOCAL_URL = `http://localhost:${PORT}`;
const app = createApp();
let shuttingDown = false;

const server = app.listen(PORT, () => {
  console.log(`TGK Back running on ${LOCAL_URL}`);
  console.log(`Database path: ${getDbPath()}`);
  console.log(`Docusign configured: ${isDocusignConfigured()}`);
});

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}; shutting down backend.`);

  server.close(() => {
    closeDb();
    console.log('Backend shutdown complete.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    closeDb();
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
