import { deniedResponse, hasWriteAccess } from "@/lib/auth";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { listEvents, replaceEvents } from "@/lib/store";
import { isEventShape } from "@/lib/validate";
import { todayKey } from "@/lib/dates";
import type { DofficeEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

const IMPORT_LIMIT = 20000;

export async function GET() {
  const events = await listEvents();
  return new Response(`${JSON.stringify(events, null, 2)}\n`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="doffice-${todayKey()}.json"`,
    },
  });
}

export async function PUT(request: Request) {
  if (!allowRequest(request)) return throttledResponse();
  if (!hasWriteAccess(request)) return deniedResponse();

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

  const valid = rows.filter(isEventShape) as DofficeEvent[];
  if (valid.length === 0) {
    return Response.json(
      { error: "Yedekte geçerli kayıt bulunamadı." },
      { status: 400 },
    );
  }

  const events = await replaceEvents(valid);
  return Response.json({ events, imported: events.length });
}
