/**
 * tests/setupEnv.ts
 *
 * Runs in EVERY Jest worker process BEFORE any test file or src import.
 * This is the correct place to set env vars that src/config/env.ts reads
 * at module load time.
 *
 * Uses `setupFiles` in jest.config.ts (NOT globalSetup — globalSetup runs
 * in a separate main process and its env vars don't reach worker processes).
 */

// Set all env vars BEFORE any src module is imported
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Load DATABASE_URL from .env if not already in environment
if (!process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
  } catch {
    // ignore
  }
}

if (!process.env.DATABASE_URL) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌ DATABASE_URL is not set!

  Option 1 — Add to your .env file:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/content_broadcasting

  Option 2 — Pass inline:
    DATABASE_URL=postgresql://... npm test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

process.env.JWT_SECRET      = 'test-secret-key-that-is-minimum-32-characters-long!!';
process.env.JWT_EXPIRES_IN  = '7d';
process.env.BCRYPT_ROUNDS   = '4';          // Low rounds → fast tests
process.env.MAX_FILE_SIZE   = '10485760';
process.env.UPLOAD_DIR      = 'uploads/test';
process.env.USE_S3          = 'false';
process.env.REDIS_URL       = 'redis://localhost:6379';
process.env.CACHE_TTL       = '60';
process.env.RATE_LIMIT_WINDOW_MS   = '900000';
process.env.RATE_LIMIT_MAX         = '10000'; // High → tests never get rate-limited
process.env.PUBLIC_RATE_LIMIT_MAX  = '10000';