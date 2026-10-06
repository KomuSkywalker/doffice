import { OPEN_DAY, slotIsFree } from "@/lib/availability";
import { nowInZone } from "@/lib/clock";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { createAppointment, findLiveLink, readDoc, StorageError } from "@/lib/store";
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

  const token = (body as { token?: unknown }).token;
  const link = await findLiveLink(typeof token === "string" ? token : "");
  if (!link) {
    return Response.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş." },
      { status: 404 },
    );
  }

  const doc = await readDoc();
  const now = nowInZone();
  const nowKey = now.key;
  const nowMinutes = now.minutes;

  const free = slotIsFree(
    {
      events: doc.events,
      appointments: doc.appointments,
      routines: doc.routines,
    },
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
      duration: OPEN_DAY.slotMinutes,
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
