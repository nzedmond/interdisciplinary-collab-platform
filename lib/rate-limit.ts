type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const globalStore = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitBucket>;
};

const rateLimitStore = globalStore.rateLimitStore ?? new Map<string, RateLimitBucket>();

if (!globalStore.rateLimitStore) {
  globalStore.rateLimitStore = rateLimitStore;
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function enforceRateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const clientId = getClientIdentifier(request);
  const key = `${options.bucket}:${clientId}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return { allowed: true };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    console.warn(`[rate-limit] blocked bucket=${options.bucket} client=${clientId} retryAfter=${retryAfterSeconds}s`);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true };
}
