type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();

function prune(now = Date.now()) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

export function incrementBucket(key: string, windowMs: number) {
  const now = Date.now();
  prune(now);

  const current = buckets.get(key);
  if (!current || current.expiresAt <= now) {
    const next = { count: 1, expiresAt: now + windowMs };
    buckets.set(key, next);
    return next;
  }

  const next = { count: current.count + 1, expiresAt: current.expiresAt };
  buckets.set(key, next);
  return next;
}

export function getBucket(key: string) {
  prune();
  return buckets.get(key) ?? null;
}

export function resetBuckets() {
  buckets.clear();
}

export const redis = {
  enabled: false,
  async get(_key: string) {
    return null;
  },
  async set() {
    return "OK" as const;
  }
};
