import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { requestAuthorized, unauthorizedResponse } from "@/lib/session";
import { revokeLink, StorageError } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!allowRequest(request)) return throttledResponse();
  if (!requestAuthorized(request)) return unauthorizedResponse();

  const { id } = await context.params;
  if (!id || id.length > 100) {
    return Response.json({ error: "Geçersiz bağlantı." }, { status: 400 });
  }

  try {
    const link = await revokeLink(id);
    if (!link) {
      return Response.json({ error: "Bağlantı bulunamadı." }, { status: 404 });
    }
    return Response.json({ link });
  } catch (error) {
    if (error instanceof StorageError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
