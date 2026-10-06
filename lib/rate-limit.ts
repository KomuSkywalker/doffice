type Bucket = { windowMs: number; max: number };

const BUCKETS: Record<string, Bucket> = {
  genel: { windowMs: 60_000, max: 120 },
  giris: { windowMs: 10 * 60_000, max: 12 },
  randevu: { windowMs: 60 * 60_000, max: 8 },
};

const hits = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "yerel";
}

export function allowRequest(request: Request, bucket: keyof typeof BUCKETS = "genel") {
  const limits = BUCKETS[bucket] ?? BUCKETS.genel;
  const key = `${bucket}:${clientKey(request)}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + limits.windowMs });
    return true;
  }

  entry.count += 1;
  if (hits.size > 800) {
    for (const [id, value] of hits) {
      if (value.resetAt < now) hits.delete(id);
    }
  }
  return entry.count <= limits.max;
}

export function throttledResponse() {
  return Response.json(
    { error: "Çok fazla istek. Bir dakika sonra dene." },
    { status: 429 },
  );
}
