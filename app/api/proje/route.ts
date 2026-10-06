import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { createProject, listProjects, StorageError } from "@/lib/store";
import { parseProject } from "@/lib/validate";

export const dynamic = "force-dynamic";

const PROJECT_LIMIT = 200;

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const projects = await listProjects();
  return Response.json({ projects });
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

  const parsed = parseProject(body, false);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const current = await listProjects();
  if (current.length >= PROJECT_LIMIT) {
    return Response.json(
      { error: `En fazla ${PROJECT_LIMIT} proje tutulabilir.` },
      { status: 409 },
    );
  }

  try {
    const project = await createProject(parsed.value);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
