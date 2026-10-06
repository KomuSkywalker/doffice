import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { createShortcut, listShortcuts, StorageError } from "@/lib/store";
import { parseShortcut } from "@/lib/validate";

export const dynamic = "force-dynamic";

const SHORTCUT_LIMIT = 40;

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const shortcuts = await listShortcuts();
  return Response.json({ shortcuts });
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

  const parsed = parseShortcut(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const current = await listShortcuts();
  if (current.length >= SHORTCUT_LIMIT) {
    return Response.json(
      { error: `En fazla ${SHORTCUT_LIMIT} kısayol tutulabilir.` },
      { status: 409 },
    );
  }

  try {
    const shortcut = await createShortcut(parsed.value);
    return Response.json({ shortcut }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
