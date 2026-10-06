import type { Metadata } from "next";
import { BookingPage } from "@/components/BookingPage";
import { availableDays } from "@/lib/availability";
import { nowInZone } from "@/lib/clock";
import { parseKey } from "@/lib/dates";
import { readDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müsait saatler",
  description: "Boş gün ve saatleri gör, randevu talebi oluştur.",
  robots: { index: false, follow: false },
};

export default async function MusaitlikPage() {
  const doc = await readDoc();
  const now = nowInZone();
  const nowKey = now.key;
  const nowMinutes = now.minutes;
  const parts = parseKey(nowKey);
  const month = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}`;

  const days = availableDays(
    doc.availability,
    doc.events,
    doc.appointments,
    nowKey,
    month,
    nowKey,
    nowMinutes,
  );

  return (
    <BookingPage
      initial={{
        month,
        today: nowKey,
        availability: {
          days: doc.availability.days,
          start: doc.availability.start,
          end: doc.availability.end,
          slotMinutes: doc.availability.slotMinutes,
          note: doc.availability.note,
        },
        days,
      }}
    />
  );
}
