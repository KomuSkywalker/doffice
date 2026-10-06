import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { createRoutine, listRoutines, StorageError } from "@/lib/store";
import { parseRoutine } from "@/lib/validate";

export const dynamic = "force-dynamic";

const ROUTINE_LIMIT = 60;

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const routines = await listRoutines();
  return Response.json({ routines });
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

  const parsed = parseRoutine(body, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const current = await listRoutines();
  if (current.length >= ROUTINE_LIMIT) {
    return Response.json(
      { error: `En fazla ${ROUTINE_LIMIT} rutin tutulabilir.` },
      { status: 409 },
    );
  }

  try {
    const routine = await createRoutine(parsed.value);
    return Response.json({ routine }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
