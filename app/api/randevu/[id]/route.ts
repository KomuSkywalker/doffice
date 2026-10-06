import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { decideAppointment, StorageError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  const { id } = await context.params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Geçersiz kayıt kimliği." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const karar = (body as { karar?: unknown }).karar;
  if (karar !== "onayla" && karar !== "reddet") {
    return Response.json({ error: "Karar geçersiz." }, { status: 400 });
  }

  try {
    const appointment = await decideAppointment(id, karar === "onayla");
    if (!appointment) {
      return Response.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }
    return Response.json({ appointment });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
