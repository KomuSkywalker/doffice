import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { DofficeEvent, EventDraft } from "./types";
import { isEventShape } from "./validate";

const DATA_DIR = path.join(process.cwd(), "data");

const DATA_FILE = path.join(
  DATA_DIR,
  path.basename(process.env.DOFFICE_DATA_FILE ?? "events.json"),
);

const SAMPLE_FILE = path.join(DATA_DIR, "events.sample.json");

const BLOB_PATH = "doffice/events.json";

let writeChain: Promise<unknown> = Promise.resolve();

export class StorageError extends Error {}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function serialize(events: DofficeEvent[]) {
  return `${JSON.stringify(events, null, 2)}\n`;
}

function normalize(row: Record<string, unknown>): DofficeEvent {
  const now = new Date().toISOString();
  return {
    id: String(row.id),
    date: String(row.date),
    time: typeof row.time === "string" ? row.time : null,
    title: String(row.title),
    note: typeof row.note === "string" ? row.note : null,
    tag: row.tag as DofficeEvent["tag"],
    repeat: row.repeat as DofficeEvent["repeat"],
    done: row.done === true,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now,
  };
}

function parseEvents(text: string): DofficeEvent[] {
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(isEventShape)
    .map((row) => normalize(row as unknown as Record<string, unknown>));
}

async function readFileEvents(file: string) {
  return parseEvents(await fs.readFile(file, "utf8"));
}

async function readSample() {
  try {
    return await readFileEvents(SAMPLE_FILE);
  } catch {
    return [];
  }
}

async function blobRead(): Promise<DofficeEvent[] | null> {
  const token = blobToken();
  if (!token) return null;
  const { get } = await import("@vercel/blob");
  const found = await get(BLOB_PATH, {
    access: "private",
    token,
    useCache: false,
  });
  if (!found || found.statusCode !== 200 || !found.stream) return null;
  return parseEvents(await new Response(found.stream).text());
}

async function blobWrite(events: DofficeEvent[]) {
  const token = blobToken();
  if (!token) throw new StorageError("Blob anahtarı tanımlı değil.");
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, serialize(events), {
    access: "private",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

async function fileWrite(events: DofficeEvent[]) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temp, serialize(events), "utf8");
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

async function persist(events: DofficeEvent[]) {
  if (blobToken()) {
    await blobWrite(events);
    return;
  }
  await fileWrite(events);
}

export async function listEvents(): Promise<DofficeEvent[]> {
  if (blobToken()) {
    const stored = await blobRead();
    if (stored) return stored;
    const seed = await readSample();
    await blobWrite(seed);
    return seed;
  }

  try {
    return await readFileEvents(DATA_FILE);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }

  const seed = await readSample();
  try {
    await fileWrite(seed);
  } catch {
    return seed;
  }
  return seed;
}

function mutate<T>(task: (events: DofficeEvent[]) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const events = await listEvents();
    return task(events);
  };
  const next = writeChain.then(run, run);
  writeChain = next.catch(() => undefined);
  return next;
}

export function createEvent(draft: EventDraft) {
  return mutate(async (events) => {
    const now = new Date().toISOString();
    const event: DofficeEvent = {
      id: randomUUID(),
      date: draft.date,
      time: draft.time ?? null,
      title: draft.title,
      note: draft.note ?? null,
      tag: draft.tag ?? "genel",
      repeat: draft.repeat ?? "yok",
      done: draft.done ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await persist([...events, event]);
    return event;
  });
}

export function updateEvent(id: string, draft: Partial<EventDraft>) {
  return mutate(async (events) => {
    const current = events.find((event) => event.id === id);
    if (!current) return null;
    const updated: DofficeEvent = {
      ...current,
      ...draft,
      time: draft.time === undefined ? current.time : (draft.time ?? null),
      note: draft.note === undefined ? current.note : (draft.note ?? null),
      updatedAt: new Date().toISOString(),
    };
    await persist(events.map((event) => (event.id === id ? updated : event)));
    return updated;
  });
}

export function deleteEvent(id: string) {
  return mutate(async (events) => {
    const exists = events.some((event) => event.id === id);
    if (!exists) return false;
    await persist(events.filter((event) => event.id !== id));
    return true;
  });
}

export function replaceEvents(events: DofficeEvent[]) {
  return mutate(async () => {
    await persist(events);
    return events;
  });
}
