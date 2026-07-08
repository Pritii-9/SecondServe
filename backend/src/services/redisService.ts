import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Connect to local redis by default or use REDIS_URL from docker/env
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const isUpstash = redisUrl.includes("upstash.io");

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: false,
    ...(isUpstash && {
      tls: true,
      rejectUnauthorized: false,
    }),
  },
});

redisClient.on("error", (err) => console.error("[Redis] Client Error", err));
redisClient.on("connect", () => console.log(`[Redis] Connected to ${redisUrl}`));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn("[Redis] Could not connect to Redis. Running without cache.");
    }
  }
}

/**
 * Get cached data by key
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisClient.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`[Redis] Error getting cache for key ${key}:`, err);
  }
  return null;
}

/**
 * Set cache data with an expiration time in seconds
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 300) {
  if (!redisClient.isOpen) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error(`[Redis] Error setting cache for key ${key}:`, err);
  }
}

/**
 * Invalidate all keys matching a specific pattern (e.g. "nearby:*")
 */
export async function invalidateCachePattern(pattern: string) {
  if (!redisClient.isOpen) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Redis] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    console.error(`[Redis] Error invalidating cache pattern ${pattern}:`, err);
  }
}

export default redisClient;
