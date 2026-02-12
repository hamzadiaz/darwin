// Simple in-memory rate limiter for serverless (per-instance)
// Not distributed — but prevents abuse from single-user spam

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window size in seconds */
  windowSec: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowSec };
  }

  if (entry.count >= config.max) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: true, remaining: config.max - entry.count, resetIn };
}

// Global daily counter for AI calls specifically
let aiCallsToday = { count: 0, date: new Date().toDateString() };

export function checkDailyAiLimit(dailyMax: number = 100): { allowed: boolean; used: number } {
  const today = new Date().toDateString();
  if (aiCallsToday.date !== today) {
    aiCallsToday = { count: 0, date: today };
  }
  if (aiCallsToday.count >= dailyMax) {
    return { allowed: false, used: aiCallsToday.count };
  }
  aiCallsToday.count++;
  return { allowed: true, used: aiCallsToday.count };
}
