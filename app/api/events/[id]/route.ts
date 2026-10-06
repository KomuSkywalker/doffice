import { deniedResponse, hasWriteAccess } from "@/lib/auth";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { deleteEvent, updateEvent } from "@/lib/store";
import { parseDraft } from "@/lib/validate";

export const dynamic = "force-dynamic";

function invalidId() {
  return Response.json({ error: "Geçersiz kayıt kimliği." }, { status: 400 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!hasWriteAccess(request)) return deniedResponse();

  const { id } = await context.params;
  if (!id || id.length > 100) return invalidId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const parsed = parseDraft(body, true);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const event = await updateEvent(id, parsed.value);
  if (!event) {
    return Response.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }
  return Response.json({ event });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!hasWriteAccess(request)) return deniedResponse();

  const { id } = await context.params;
  if (!id || id.length > 100) return invalidId();

  const removed = await deleteEvent(id);
  if (!removed) {
    return Response.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
