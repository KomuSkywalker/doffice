import { availableDays } from "@/lib/availability";
import { nowInZone } from "@/lib/clock";
import { makeKey, parseKey } from "@/lib/dates";
import { allowRequest, throttledResponse } from "@/lib/rate-limit";
import { readDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

function monthPrefix(value: string | null, todayKey: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  const today = parseKey(todayKey);
  return makeKey(today.year, today.month, 1).slice(0, 7);
}

export async function GET(request: Request) {
  if (!allowRequest(request)) return throttledResponse();

  const url = new URL(request.url);
  const now = nowInZone();
  const nowKey = now.key;
  const nowMinutes = now.minutes;
  const month = monthPrefix(url.searchParams.get("ay"), nowKey);
  const doc = await readDoc();
  const fromKey = month < nowKey.slice(0, 7) ? nowKey : `${month}-01`;

  const days = availableDays(
    doc.availability,
    doc.events,
    doc.appointments,
    fromKey < nowKey ? nowKey : fromKey,
    month,
    nowKey,
    nowMinutes,
  );

  return Response.json({
    month,
    today: nowKey,
    availability: {
      days: doc.availability.days,
      start: doc.availability.start,
      end: doc.availability.end,
      slotMinutes: doc.availability.slotMinutes,
      horizonDays: doc.availability.horizonDays,
      note: doc.availability.note,
    },
    days,
  });
}
