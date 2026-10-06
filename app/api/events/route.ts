import { deniedResponse, hasWriteAccess, writeKeyRequired } from "@/lib/auth";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { createEvent, listEvents } from "@/lib/store";
import { parseDraft } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await listEvents();
  return Response.json({ events, locked: writeKeyRequired() });
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return throttledResponse();
  if (!hasWriteAccess(request)) return deniedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const parsed = parseDraft(body, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const event = await createEvent(parsed.value);
  return Response.json({ event }, { status: 201 });
}
