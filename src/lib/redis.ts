import { createClient } from 'redis';
import { env } from '../config/env';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    // redisClient = createClient({ url: env.REDIS_URL });
    redisClient = createClient({
        url: env.REDIS_URL,
        socket: {
            tls: env.NODE_ENV === 'production', 
            reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
          },
      });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    try {
      await redisClient.connect();
    } catch (err) {
      console.warn('⚠️  Redis unavailable, caching disabled:', (err as Error).message);
      redisClient = null;
    }
  }
  return redisClient;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;
    await client.setEx(key, ttlSeconds, value);
  } catch {
    // Silently fail — cache is optional
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch {
    // Silently fail
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}