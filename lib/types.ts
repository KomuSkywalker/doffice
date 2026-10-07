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

export type ProjectStatus = "aktif" | "beklemede" | "bitti";

export type ProjectFile = {
  id: string;
  label: string;
  url: string;
};

export type ProjectStep = {
  id: string;
  title: string;
  done: boolean;
};

export type Project = {
  id: string;
  name: string;
  note: string | null;
  status: ProjectStatus;
  color: string;
  steps: ProjectStep[];
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectDraft = {
  name: string;
  note: string | null;
  status: ProjectStatus;
  color: string;
  steps: ProjectStep[];
  files: ProjectFile[];
};

export type Shortcut = {
  id: string;
  label: string;
  url: string;
  color: string;
  createdAt: string;
};

export type ShortcutDraft = {
  label: string;
  url: string;
  color: string;
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

export type WidgetId = "program" | "gundem" | "kisayol";

export type WidgetColumn = "sol" | "sag";

export type HomeWidget = {
  id: WidgetId;
  column: WidgetColumn;
  visible: boolean;
};

export type StoreDoc = {
  events: DofficeEvent[];
  routines: Routine[];
  projects: Project[];
  shortcuts: Shortcut[];
  appointments: Appointment[];
  notifications: AppNotification[];
  links: ShareLink[];
  layout: HomeWidget[];
};

export const WIDGETS: { id: WidgetId; label: string }[] = [
  { id: "program", label: "Bugünün programı" },
  { id: "gundem", label: "Gündem" },
  { id: "kisayol", label: "Hızlı erişim" },
];

export const WIDGET_IDS = WIDGETS.map((widget) => widget.id);

export const DEFAULT_LAYOUT: HomeWidget[] = [
  { id: "program", column: "sol", visible: true },
  { id: "gundem", column: "sag", visible: true },
  { id: "kisayol", column: "sag", visible: true },
];

export function widgetLabel(id: WidgetId) {
  return WIDGETS.find((widget) => widget.id === id)?.label ?? id;
}

export function normalizeLayout(rows: unknown): HomeWidget[] {
  const source = Array.isArray(rows) ? rows : [];
  const seen = new Set<WidgetId>();
  const layout: HomeWidget[] = [];

  for (const row of source) {
    const item = row as Partial<HomeWidget>;
    const id = item?.id as WidgetId;
    if (!WIDGET_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    layout.push({
      id,
      column: item.column === "sag" ? "sag" : "sol",
      visible: item.visible !== false,
    });
  }

  for (const fallback of DEFAULT_LAYOUT) {
    if (!seen.has(fallback.id)) layout.push({ ...fallback });
  }

  return layout;
}

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

export const PROJECT_STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "aktif", label: "Aktif" },
  { id: "beklemede", label: "Beklemede" },
  { id: "bitti", label: "Bitti" },
];

export const PROJECT_STATUS_IDS = PROJECT_STATUSES.map((row) => row.id);

export function statusLabel(id: ProjectStatus) {
  return PROJECT_STATUSES.find((row) => row.id === id)?.label ?? "Aktif";
}

export function projectProgress(project: Project) {
  const total = project.steps.length;
  const done = project.steps.filter((step) => step.done).length;
  const current = project.steps.find((step) => !step.done)?.title ?? null;
  return {
    total,
    done,
    current,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function siteName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

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
