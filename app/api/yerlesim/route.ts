import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { readDoc, saveLayout, StorageError } from "@/lib/store";
import { parseLayout } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const doc = await readDoc();
  return Response.json({ layout: doc.layout });
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

  const parsed = parseLayout(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const layout = await saveLayout(parsed.value);
    return Response.json({ layout });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
