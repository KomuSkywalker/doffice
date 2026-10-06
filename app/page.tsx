import { Doffice } from "@/components/Doffice";
import { writeKeyRequired } from "@/lib/auth";
import { todayKey } from "@/lib/dates";
import { listEvents } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await listEvents();
  return (
    <Doffice
      initialEvents={events}
      locked={writeKeyRequired()}
      serverToday={todayKey()}
    />
  );
}
