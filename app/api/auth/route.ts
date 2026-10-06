import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import {
  createSessionvalue,
  gateEnabled,
  passwordMatches,
  sessionCookie,
  SESSION_MAX_AGE,
} from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowRequest(request, "giris")) return throttledResponse();

  if (!gateEnabled()) {
    return Response.json(
      { error: "Bu kurulumda şifre tanımlı değil." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const password = (body as { password?: unknown }).password;
  if (!passwordMatches(password)) {
    return Response.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie(createSessionvalue(), SESSION_MAX_AGE),
    },
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie("", 0),
    },
  });
}
