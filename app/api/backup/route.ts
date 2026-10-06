import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { readDoc, replaceEvents, StorageError } from "@/lib/store";
import { isEventShape, isRoutineShape } from "@/lib/validate";
import { nowInZone } from "@/lib/clock";
import type { DofficeEvent, Routine } from "@/lib/types";

export const dynamic = "force-dynamic";

const IMPORT_LIMIT = 20000;

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const doc = await readDoc();
  const backup = {
    events: doc.events,
    routines: doc.routines,
    availability: doc.availability,
  };
  return new Response(`${JSON.stringify(backup, null, 2)}\n`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="doffice-${nowInZone().key}.json"`,
    },
  });
}

export async function PUT(request: Request) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const rows = Array.isArray(body)
    ? body
    : Array.isArray((body as { events?: unknown }).events)
      ? (body as { events: unknown[] }).events
      : null;

  if (!rows) {
    return Response.json(
      { error: "Yedek dosyası bir kayıt listesi içermeli." },
      { status: 400 },
    );
  }

  if (rows.length > IMPORT_LIMIT) {
    return Response.json(
      { error: `Yedek en fazla ${IMPORT_LIMIT} kayıt içerebilir.` },
      { status: 413 },
    );
  }

  const routineRows = Array.isArray((body as { routines?: unknown }).routines)
    ? ((body as { routines: unknown[] }).routines.filter(
        isRoutineShape,
      ) as Routine[])
    : null;

  const valid = rows.filter(isEventShape) as DofficeEvent[];
  if (valid.length === 0) {
    return Response.json(
      { error: "Yedekte geçerli kayıt bulunamadı." },
      { status: 400 },
    );
  }

  try {
    const events = await replaceEvents(valid, routineRows);
    return Response.json({
      events,
      routines: routineRows,
      imported: events.length,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
