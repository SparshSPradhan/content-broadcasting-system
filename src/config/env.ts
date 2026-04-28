import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),

  // File Upload
  MAX_FILE_SIZE: z.string().default('10485760').transform(Number), // 10MB
  UPLOAD_DIR: z.string().default('uploads'),

  // AWS S3
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  USE_S3: z.string().default('false').transform((v) => v === 'true'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL: z.string().default('60').transform(Number), // seconds


  ENABLE_DOCS: z.string().default('false').transform((v) => v === 'true'),


  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 min
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  PUBLIC_RATE_LIMIT_MAX: z.string().default('30').transform(Number),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;