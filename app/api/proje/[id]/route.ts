import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import {
  deleteProject,
  listProjects,
  StorageError,
  updateProject,
} from "@/lib/store";
import { parseProject } from "@/lib/validate";

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

  const current = (await listProjects()).find((row) => row.id === id);
  if (!current) {
    return Response.json({ error: "Proje bulunamadı." }, { status: 404 });
  }

  const merged = {
    name: current.name,
    note: current.note,
    status: current.status,
    color: current.color,
    steps: current.steps,
    files: current.files,
    ...(body as Record<string, unknown>),
  };

  const parsed = parseProject(merged, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const project = await updateProject(id, parsed.value);
    if (!project) {
      return Response.json({ error: "Proje bulunamadı." }, { status: 404 });
    }
    return Response.json({ project });
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
    const removed = await deleteProject(id);
    if (!removed) {
      return Response.json({ error: "Proje bulunamadı." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
