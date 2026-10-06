import { promises as fs } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import {
  DEFAULT_AVAILABILITY,
  DEFAULT_DURATION,
  linkIsLive,
  type Appointment,
  type AppNotification,
  type Availability,
  type DofficeEvent,
  type EventDraft,
  type ShareLink,
  type StoreDoc,
} from "./types";
import { isEventShape } from "./validate";

const DATA_DIR = path.join(process.cwd(), "data");

const DATA_FILE = path.join(
  DATA_DIR,
  path.basename(process.env.DOFFICE_DATA_FILE ?? "events.json"),
);

const BLOB_PATH = "doffice/events.json";

let writeChain: Promise<unknown> = Promise.resolve();

export class StorageError extends Error {}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function emptyDoc(): StoreDoc {
  return {
    events: [],
    appointments: [],
    notifications: [],
    availability: { ...DEFAULT_AVAILABILITY },
    links: [],
  };
}

function serialize(doc: StoreDoc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

function normalizeEvent(row: Record<string, unknown>): DofficeEvent {
  const now = new Date().toISOString();
  const duration = Number(row.duration);
  return {
    id: String(row.id),
    date: String(row.date),
    time: typeof row.time === "string" ? row.time : null,
    duration:
      Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION,
    title: String(row.title),
    note: typeof row.note === "string" ? row.note : null,
    tag: row.tag as DofficeEvent["tag"],
    repeat: row.repeat as DofficeEvent["repeat"],
    done: row.done === true,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now,
  };
}

function normalizeDoc(parsed: unknown): StoreDoc {
  const doc = emptyDoc();
  if (Array.isArray(parsed)) {
    doc.events = parsed
      .filter(isEventShape)
      .map((row) => normalizeEvent(row as unknown as Record<string, unknown>));
    return doc;
  }
  if (typeof parsed !== "object" || parsed === null) return doc;

  const row = parsed as Record<string, unknown>;
  if (Array.isArray(row.events)) {
    doc.events = row.events
      .filter(isEventShape)
      .map((item) => normalizeEvent(item as unknown as Record<string, unknown>));
  }
  if (Array.isArray(row.appointments)) {
    doc.appointments = row.appointments as Appointment[];
  }
  if (Array.isArray(row.notifications)) {
    doc.notifications = row.notifications as AppNotification[];
  }
  if (Array.isArray(row.links)) {
    doc.links = row.links as ShareLink[];
  }
  if (typeof row.availability === "object" && row.availability !== null) {
    doc.availability = {
      ...DEFAULT_AVAILABILITY,
      ...(row.availability as Partial<Availability>),
    };
  }
  return doc;
}

async function blobRead(): Promise<StoreDoc | null> {
  const token = blobToken();
  if (!token) return null;
  const { get } = await import("@vercel/blob");
  const found = await get(BLOB_PATH, {
    access: "private",
    token,
    useCache: false,
  });
  if (!found || found.statusCode !== 200 || !found.stream) return null;
  const text = await new Response(found.stream).text();
  return normalizeDoc(JSON.parse(text));
}

async function blobWrite(doc: StoreDoc) {
  const token = blobToken();
  if (!token) throw new StorageError("Blob anahtarı tanımlı değil.");
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, serialize(doc), {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function fileWrite(doc: StoreDoc) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temp, serialize(doc), "utf8");
    await fs.rename(temp, DATA_FILE);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      throw new StorageError(
        "Bu sunucuda dosyaya yazılamıyor. Kalıcı depolama için Blob bağla.",
      );
    }
    throw error;
  }
}

async function writeDoc(doc: StoreDoc) {
  if (blobToken()) {
    await blobWrite(doc);
    return;
  }
  await fileWrite(doc);
}

export async function readDoc(): Promise<StoreDoc> {
  if (blobToken()) {
    const stored = await blobRead();
    if (stored) return stored;
    const fresh = emptyDoc();
    await blobWrite(fresh);
    return fresh;
  }

  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    return normalizeDoc(JSON.parse(text));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }

  const fresh = emptyDoc();
  try {
    await fileWrite(fresh);
  } catch {
    return fresh;
  }
  return fresh;
}

function mutate<T>(task: (doc: StoreDoc) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const doc = await readDoc();
    return task(doc);
  };
  const next = writeChain.then(run, run);
  writeChain = next.catch(() => undefined);
  return next;
}

export async function listEvents(): Promise<DofficeEvent[]> {
  return (await readDoc()).events;
}

export function createEvent(draft: EventDraft) {
  return mutate(async (doc) => {
    const now = new Date().toISOString();
    const event: DofficeEvent = {
      id: randomUUID(),
      date: draft.date,
      time: draft.time ?? null,
      duration: draft.duration ?? DEFAULT_DURATION,
      title: draft.title,
      note: draft.note ?? null,
      tag: draft.tag ?? "genel",
      repeat: draft.repeat ?? "yok",
      done: draft.done ?? false,
      createdAt: now,
      updatedAt: now,
    };
    doc.events = [...doc.events, event];
    await writeDoc(doc);
    return event;
  });
}

export function updateEvent(id: string, draft: Partial<EventDraft>) {
  return mutate(async (doc) => {
    const current = doc.events.find((event) => event.id === id);
    if (!current) return null;
    const updated: DofficeEvent = {
      ...current,
      ...draft,
      time: draft.time === undefined ? current.time : (draft.time ?? null),
      note: draft.note === undefined ? current.note : (draft.note ?? null),
      duration: draft.duration ?? current.duration,
      updatedAt: new Date().toISOString(),
    };
    doc.events = doc.events.map((event) => (event.id === id ? updated : event));
    await writeDoc(doc);
    return updated;
  });
}

export function deleteEvent(id: string) {
  return mutate(async (doc) => {
    const exists = doc.events.some((event) => event.id === id);
    if (!exists) return false;
    doc.events = doc.events.filter((event) => event.id !== id);
    await writeDoc(doc);
    return true;
  });
}

export function replaceEvents(events: DofficeEvent[]) {
  return mutate(async (doc) => {
    doc.events = events;
    await writeDoc(doc);
    return events;
  });
}

export function saveAvailability(availability: Availability) {
  return mutate(async (doc) => {
    doc.availability = availability;
    await writeDoc(doc);
    return availability;
  });
}

export function createAppointment(input: {
  date: string;
  time: string;
  duration: number;
  name: string;
  contact: string;
  note: string | null;
}) {
  return mutate(async (doc) => {
    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: randomUUID(),
      date: input.date,
      time: input.time,
      duration: input.duration,
      name: input.name,
      contact: input.contact,
      note: input.note,
      status: "bekliyor",
      eventId: null,
      createdAt: now,
      updatedAt: now,
    };
    const notification: AppNotification = {
      id: randomUUID(),
      kind: "randevu",
      appointmentId: appointment.id,
      title: "Yeni randevu talebi",
      body: `${input.name}, ${input.date} ${input.time}`,
      readAt: null,
      createdAt: now,
    };
    doc.appointments = [...doc.appointments, appointment];
    doc.notifications = [notification, ...doc.notifications].slice(0, 200);
    await writeDoc(doc);
    return appointment;
  });
}

export function decideAppointment(id: string, approve: boolean) {
  return mutate(async (doc) => {
    const current = doc.appointments.find((row) => row.id === id);
    if (!current) return null;
    const now = new Date().toISOString();

    let eventId = current.eventId;
    if (approve && !eventId) {
      const event: DofficeEvent = {
        id: randomUUID(),
        date: current.date,
        time: current.time,
        duration: current.duration,
        title: `Randevu: ${current.name}`,
        note: [current.contact, current.note].filter(Boolean).join("\n"),
        tag: "gorusme",
        repeat: "yok",
        done: false,
        createdAt: now,
        updatedAt: now,
      };
      doc.events = [...doc.events, event];
      eventId = event.id;
    }

    if (!approve && eventId) {
      doc.events = doc.events.filter((event) => event.id !== eventId);
      eventId = null;
    }

    const updated: Appointment = {
      ...current,
      status: approve ? "onaylandi" : "reddedildi",
      eventId,
      updatedAt: now,
    };
    doc.appointments = doc.appointments.map((row) =>
      row.id === id ? updated : row,
    );
    await writeDoc(doc);
    return updated;
  });
}

export function markNotificationsRead() {
  return mutate(async (doc) => {
    const now = new Date().toISOString();
    doc.notifications = doc.notifications.map((row) =>
      row.readAt ? row : { ...row, readAt: now },
    );
    await writeDoc(doc);
    return doc.notifications;
  });
}

export function createLink(label: string, lifetimeDays: number) {
  return mutate(async (doc) => {
    const now = new Date();
    const link: ShareLink = {
      id: randomUUID(),
      token: randomBytes(9).toString("base64url"),
      label,
      createdAt: now.toISOString(),
      expiresAt:
        lifetimeDays > 0
          ? new Date(now.getTime() + lifetimeDays * 86400000).toISOString()
          : null,
      revokedAt: null,
    };
    doc.links = [link, ...doc.links].slice(0, 100);
    await writeDoc(doc);
    return link;
  });
}

export function revokeLink(id: string) {
  return mutate(async (doc) => {
    const current = doc.links.find((row) => row.id === id);
    if (!current) return null;
    const updated: ShareLink = { ...current, revokedAt: new Date().toISOString() };
    doc.links = doc.links.map((row) => (row.id === id ? updated : row));
    await writeDoc(doc);
    return updated;
  });
}

export async function findLiveLink(token: string) {
  if (!token) return null;
  const doc = await readDoc();
  const link = doc.links.find((row) => row.token === token);
  if (!link || !linkIsLive(link)) return null;
  return link;
}
