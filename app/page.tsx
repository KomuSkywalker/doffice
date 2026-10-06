import { cookies } from "next/headers";
import { Doffice } from "@/components/Doffice";
import { LoginScreen } from "@/components/LoginScreen";
import { SetupNotice } from "@/components/SetupNotice";
import { nowInZone } from "@/lib/clock";
import {
  gateEnabled,
  SESSION_COOKIE_NAME,
  sessionValid,
  setupMissing,
} from "@/lib/session";
import { readDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (setupMissing()) return <SetupNotice />;

  if (gateEnabled()) {
    const store = await cookies();
    const session = store.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionValid(session)) return <LoginScreen />;
  }

  const doc = await readDoc();

  return (
    <Doffice
      initialEvents={doc.events}
      initialRoutines={doc.routines}
      initialAvailability={doc.availability}
      initialNotifications={doc.notifications}
      initialAppointments={doc.appointments}
      initialLinks={doc.links}
      serverToday={nowInZone().key}
    />
  );
}
