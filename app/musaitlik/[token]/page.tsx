import type { Metadata } from "next";
import { BookingPage } from "@/components/BookingPage";
import { LinkNotice } from "@/components/LinkNotice";
import { availableDays } from "@/lib/availability";
import { nowInZone } from "@/lib/clock";
import { parseKey } from "@/lib/dates";
import { findLiveLink, readDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müsait saatler",
  description: "Boş gün ve saatleri gör, randevu talebi oluştur.",
  robots: { index: false, follow: false },
};

export default async function TokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await findLiveLink(token);
  if (!link) return <LinkNotice />;

  const doc = await readDoc();
  const now = nowInZone();
  const parts = parseKey(now.key);
  const month = `${parts.year}-${String(parts.month + 1).padStart(2, "0")}`;

  const days = availableDays(
    {
      availability: doc.availability,
      events: doc.events,
      appointments: doc.appointments,
      routines: doc.routines,
    },
    now.key,
    month,
    now.key,
    now.minutes,
  );

  return (
    <BookingPage
      token={token}
      initial={{
        month,
        today: now.key,
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
