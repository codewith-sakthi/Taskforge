import { createServer } from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { initSocket } from './socket/index.js';

const httpServer = createServer(app);

// Initialize Socket.IO with HTTP Server
initSocket(httpServer);

const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`🚀 TeamPulse Backend API running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server listening on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
});
