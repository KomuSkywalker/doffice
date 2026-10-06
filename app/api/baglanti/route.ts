import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { createLink, readDoc, StorageError } from "@/lib/store";

export const dynamic = "force-dynamic";

const LIFETIMES = [0, 7, 30, 90];

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const doc = await readDoc();
  return Response.json({ links: doc.links });
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const raw = body as { label?: unknown; lifetimeDays?: unknown; note?: unknown };
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  if (label.length > 60) {
    return Response.json(
      { error: "Etiket en fazla 60 karakter." },
      { status: 400 },
    );
  }

  const note = typeof raw.note === "string" ? raw.note.trim() : "";
  if (note.length > 300) {
    return Response.json({ error: "Not en fazla 300 karakter." }, { status: 400 });
  }

  const lifetimeDays = Number(raw.lifetimeDays ?? 0);
  if (!LIFETIMES.includes(lifetimeDays)) {
    return Response.json({ error: "Geçersiz süre." }, { status: 400 });
  }

  try {
    const link = await createLink(
      label.length > 0 ? label : "Adsız bağlantı",
      lifetimeDays,
      note.length > 0 ? note : null,
    );
    return Response.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
