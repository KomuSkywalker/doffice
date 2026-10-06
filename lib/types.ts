export type Repeat = "yok" | "haftalik" | "aylik" | "yillik";

export type DofficeEvent = {
  id: string;
  date: string;
  time: string | null;
  duration: number;
  title: string;
  note: string | null;
  label: string | null;
  color: string;
  repeat: Repeat;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  routineId?: string;
};

export type EventDraft = {
  date: string;
  time?: string | null;
  duration?: number;
  title: string;
  note?: string | null;
  label?: string | null;
  color?: string;
  repeat?: Repeat;
  done?: boolean;
};

export type Routine = {
  id: string;
  title: string;
  days: number[];
  start: string;
  end: string;
  label: string | null;
  color: string;
  note: string | null;
  from: string | null;
  until: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoutineDraft = {
  title: string;
  days: number[];
  start: string;
  end: string;
  label: string | null;
  color: string;
  note: string | null;
  from: string | null;
  until: string | null;
  active: boolean;
};

export type AppointmentStatus = "bekliyor" | "onaylandi" | "reddedildi";

export type Appointment = {
  id: string;
  date: string;
  time: string;
  duration: number;
  name: string;
  contact: string;
  note: string | null;
  status: AppointmentStatus;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  kind: "randevu";
  appointmentId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type ShareLink = {
  id: string;
  token: string;
  label: string;
  note: string | null;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type StoreDoc = {
  events: DofficeEvent[];
  routines: Routine[];
  appointments: Appointment[];
  notifications: AppNotification[];
  links: ShareLink[];
};

export const LINK_LIFETIMES: { days: number; label: string }[] = [
  { days: 0, label: "Süresiz" },
  { days: 7, label: "7 gün" },
  { days: 30, label: "30 gün" },
  { days: 90, label: "90 gün" },
];

export function linkIsLive(link: ShareLink, now = new Date()) {
  if (link.revokedAt) return false;
  if (link.expiresAt && new Date(link.expiresAt) < now) return false;
  return true;
}

export const DEFAULT_DURATION = 60;

export const DEFAULT_ROUTINE_START = "13:00";

export const DEFAULT_ROUTINE_END = "17:00";

export const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export const DEFAULT_COLOR = "#eec14b";

export const LABEL_LIMIT = 24;

export const PALETTE: { color: string; name: string }[] = [
  { color: "#eec14b", name: "Sarı" },
  { color: "#f2b8cf", name: "Pembe" },
  { color: "#b9cfe8", name: "Mavi" },
  { color: "#c9ded0", name: "Yeşil" },
  { color: "#e6b8ec", name: "Mor" },
  { color: "#f0c8a8", name: "Turuncu" },
  { color: "#e8857a", name: "Kırmızı" },
];

export const LEGACY_TAGS: Record<string, { label: string; color: string }> = {
  genel: { label: "Genel", color: "#eec14b" },
  is: { label: "İş", color: "#b9cfe8" },
  kisisel: { label: "Kişisel", color: "#c9ded0" },
  gorusme: { label: "Görüşme", color: "#e6b8ec" },
  odeme: { label: "Ödeme", color: "#f0c8a8" },
  onemli: { label: "Önemli", color: "#e8857a" },
  kutlama: { label: "Kutlama", color: "#f2b8cf" },
};

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeColor(value: unknown) {
  return isHexColor(value) ? value.toLowerCase() : DEFAULT_COLOR;
}

export const REPEATS: { id: Repeat; label: string }[] = [
  { id: "yok", label: "Tekrar yok" },
  { id: "haftalik", label: "Her hafta" },
  { id: "aylik", label: "Her ay" },
  { id: "yillik", label: "Her yıl" },
];

export const REPEAT_IDS = REPEATS.map((repeat) => repeat.id);

export function repeatLabel(id: Repeat) {
  return REPEATS.find((repeat) => repeat.id === id)?.label ?? "Tekrar yok";
}

export function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} saat`;
  return `${hours} saat ${rest} dakika`;
}
