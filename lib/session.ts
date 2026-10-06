import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "doffice_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function sitePassword() {
  return process.env.DOFFICE_PASSWORD ?? "";
}

export function gateEnabled() {
  return sitePassword().length > 0;
}

export function setupMissing() {
  return process.env.NODE_ENV === "production" && !gateEnabled();
}

function secret() {
  const explicit = process.env.DOFFICE_SECRET;
  if (explicit && explicit.length > 0) return explicit;
  return `doffice:${sitePassword()}`;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function passwordMatches(input: unknown) {
  const expected = sitePassword();
  if (expected.length === 0) return false;
  if (typeof input !== "string") return false;
  return safeEqual(input, expected);
}

export function createSessionvalue() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  return `${expires}.${sign(String(expires))}`;
}

export function sessionValid(value: string | undefined) {
  if (!gateEnabled()) return true;
  if (!value) return false;
  const [stamp, signature] = value.split(".");
  if (!stamp || !signature) return false;
  const expires = Number(stamp);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return safeEqual(signature, sign(stamp));
}

export function sessionCookie(value: string, maxAge: number) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function readSessionCookie(request: Request) {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const piece of header.split(";")) {
    const [name, ...rest] = piece.trim().split("=");
    if (name === COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

export function requestAuthorized(request: Request) {
  if (!gateEnabled()) return !setupMissing();
  return sessionValid(readSessionCookie(request));
}

export function unauthorizedResponse() {
  return Response.json(
    { error: "Oturum gerekli. Yeniden giriş yap." },
    { status: 401 },
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
