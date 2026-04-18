import { loadSecrets } from './secrets.js';

async function startWsServer(): Promise<void> {
  await loadSecrets();

  const [{ backEnv }, { bootstrapWsServer }, { createWsServer }, { closeDatabase }] =
    await Promise.all([
      import('../config/env.backend.js'),
      import('./ws.bootstrap.js'),
      import('../realtime/ws-server.js'),
      import('./database.bootstrap.js'),
    ]);

  try {
    const { sessionService, connectionManager, roomResolver } = await bootstrapWsServer();

    const { createServer } = await import('http');
    const httpServer = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }
      res.writeHead(404);
      res.end();
    });

    createWsServer(httpServer, connectionManager, roomResolver, sessionService);

    httpServer.listen(backEnv.PORT, () => {
      console.log(
        `WS server running\n` +
          `\tEnvironment: ${backEnv.NODE_ENV}\n` +
          `\tPort:        ${String(backEnv.PORT)}\n` +
          `\tHost:        ${backEnv.HOST}\n` +
          `\tWS:          ws://${backEnv.HOST}:${String(backEnv.PORT)}/ws\n` +
          `\tHealth:      http://${backEnv.HOST}:${String(backEnv.PORT)}/health`
      );
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Starting graceful shutdown...`);
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
      try {
        await closeDatabase();
        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      void shutdown('UNCAUGHT_EXCEPTION');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      void shutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    console.error('Failed to start WS server:', error);
    process.exit(1);
  }
}

void startWsServer();
