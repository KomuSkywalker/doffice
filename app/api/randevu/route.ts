import { slotIsFree } from "@/lib/availability";
import { nowInZone } from "@/lib/clock";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { createAppointment, readDoc, StorageError } from "@/lib/store";
import { parseAppointment } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowRequest(request, "randevu")) return throttledResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const parsed = parseAppointment(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const doc = await readDoc();
  const now = nowInZone();
  const nowKey = now.key;
  const nowMinutes = now.minutes;

  const free = slotIsFree(
    doc.availability,
    doc.events,
    doc.appointments,
    parsed.value.date,
    parsed.value.time,
    nowKey,
    nowMinutes,
  );

  if (!free) {
    return Response.json(
      { error: "Bu saat artık müsait değil, başka bir saat seç." },
      { status: 409 },
    );
  }

  try {
    const appointment = await createAppointment({
      ...parsed.value,
      duration: doc.availability.slotMinutes,
    });
    return Response.json(
      {
        appointment: {
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          status: appointment.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
