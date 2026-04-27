import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { getRedisClient, disconnectRedis } from './lib/redis';

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Connect to Redis (optional — gracefully degrades if unavailable)
    await getRedisClient();

    const server = app.listen(env.PORT, () => {
      console.log(`\n🚀 Content Broadcasting System running!`);
      console.log(`   Environment : ${env.NODE_ENV}`);
      console.log(`   Port        : ${env.PORT}`);
      console.log(`   Docs        : http://localhost:${env.PORT}/api/docs`);
      console.log(`   Health      : http://localhost:${env.PORT}/health\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚡ ${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        await disconnectRedis();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();