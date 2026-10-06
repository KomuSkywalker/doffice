const WINDOW_MS = 60_000;
const MAX_HITS = 120;

const hits = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "yerel";
}

export function allowRequest(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  entry.count += 1;
  if (hits.size > 500) {
    for (const [id, value] of hits) {
      if (value.resetAt < now) hits.delete(id);
    }
  }
  return entry.count <= MAX_HITS;
}

export function throttledResponse() {
  return Response.json(
    { error: "Çok fazla istek. Bir dakika sonra dene." },
    { status: 429 },
  );
}
