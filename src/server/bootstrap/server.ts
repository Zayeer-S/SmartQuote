import { backEnv } from '../config/env.backend.js';
import { bootstrapApplication } from './app.bootstrap.js';
import { closeDatabase } from './database.bootstrap.js';

async function startServer() {
  try {
    const app = await bootstrapApplication();

    const server = app.listen(backEnv.PORT, () => {
      console.log(`Server running 
            Environment: ${backEnv.NODE_ENV}
            Port: ${backEnv.PORT.toString()}
            Host: ${backEnv.HOST}
            API: http://${backEnv.HOST}:${String(backEnv.PORT)}/api
            Health: http://${backEnv.HOST}:${String(backEnv.PORT)}/health)\n`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
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
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
