import { timingSafeEqual } from "node:crypto";

export function writeKeyRequired() {
  return Boolean(process.env.DOFFICE_KEY);
}

export function hasWriteAccess(request: Request) {
  const expected = process.env.DOFFICE_KEY;
  if (!expected) return true;
  const provided = request.headers.get("x-doffice-key") ?? "";
  const given = Buffer.from(provided);
  const target = Buffer.from(expected);
  if (given.length !== target.length) return false;
  return timingSafeEqual(given, target);
}

export function deniedResponse() {
  return Response.json(
    { error: "Yazma yetkisi yok. Panel anahtarını gir." },
    { status: 401 },
  );
}
