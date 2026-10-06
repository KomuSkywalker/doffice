import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { markNotificationsRead, readDoc, StorageError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!requestAuthorized(request)) return unauthorizedResponse();
  const doc = await readDoc();
  return Response.json({
    notifications: doc.notifications,
    appointments: doc.appointments,
  });
}

export async function POST(request: Request) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();
  try {
    const notifications = await markNotificationsRead();
    return Response.json({ notifications });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
