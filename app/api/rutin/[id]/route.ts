import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import {
  deleteRoutine,
  listRoutines,
  StorageError,
  updateRoutine,
} from "@/lib/store";
import { parseRoutine } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Gövde JSON olmalı." }, { status: 400 });
  }

  const current = (await listRoutines()).find((routine) => routine.id === id);
  if (!current) {
    return Response.json({ error: "Rutin bulunamadı." }, { status: 404 });
  }

  const merged = {
    title: current.title,
    days: current.days,
    start: current.start,
    end: current.end,
    tag: current.tag,
    note: current.note,
    from: current.from,
    until: current.until,
    active: current.active,
    ...(body as Record<string, unknown>),
  };

  const parsed = parseRoutine(merged, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const routine = await updateRoutine(id, parsed.value);
    if (!routine) {
      return Response.json({ error: "Rutin bulunamadı." }, { status: 404 });
    }
    return Response.json({ routine });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const removed = await deleteRoutine(id);
    if (!removed) {
      return Response.json({ error: "Rutin bulunamadı." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
