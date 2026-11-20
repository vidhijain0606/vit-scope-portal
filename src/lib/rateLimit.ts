// Lightweight in-memory sliding-window rate limiter (VAPT-17). At this
// application's scale, a Redis-backed limiter would be over-engineering —
// this is sufficient to stop brute-force admin login attempts and AI-quota
// abuse from a single account, which is the actual threat model here.
// (Not distributed across multiple server instances — acceptable given the
// single-instance App Service deployment; revisit if that changes.)

const buckets = new Map<string, number[]>();

/**
 * Returns true if `key` has made fewer than `limit` calls in the last
 * `windowMs` milliseconds, and records this call. Returns false (caller
 * should reject the request) once the limit is reached.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return true;
}
