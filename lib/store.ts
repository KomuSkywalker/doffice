import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AlmanakEvent, EventDraft } from "./types";
import { isEventShape } from "./validate";

const DATA_DIR = path.join(process.cwd(), "data");

const DATA_FILE = path.join(
  DATA_DIR,
  path.basename(process.env.ALMANAK_DATA_FILE ?? "events.json"),
);

const SAMPLE_FILE = path.join(DATA_DIR, "events.sample.json");

let writeChain: Promise<unknown> = Promise.resolve();

function serialize(events: AlmanakEvent[]) {
  return `${JSON.stringify(events, null, 2)}\n`;
}

function normalize(row: Record<string, unknown>): AlmanakEvent {
  const now = new Date().toISOString();
  return {
    id: String(row.id),
    date: String(row.date),
    time: typeof row.time === "string" ? row.time : null,
    title: String(row.title),
    note: typeof row.note === "string" ? row.note : null,
    tag: row.tag as AlmanakEvent["tag"],
    repeat: row.repeat as AlmanakEvent["repeat"],
    done: row.done === true,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now,
  };
}

async function readRaw(file: string) {
  const text = await fs.readFile(file, "utf8");
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(isEventShape)
    .map((row) => normalize(row as unknown as Record<string, unknown>));
}

async function persist(events: AlmanakEvent[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, serialize(events), "utf8");
  await fs.rename(temp, DATA_FILE);
}

export async function listEvents(): Promise<AlmanakEvent[]> {
  try {
    return await readRaw(DATA_FILE);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }

  try {
    const seed = await readRaw(SAMPLE_FILE);
    await persist(seed);
    return seed;
  } catch {
    await persist([]);
    return [];
  }
}

function mutate<T>(task: (events: AlmanakEvent[]) => Promise<T> | T): Promise<T> {
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
    const event: AlmanakEvent = {
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
    const updated: AlmanakEvent = {
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

export function replaceEvents(events: AlmanakEvent[]) {
  return mutate(async () => {
    await persist(events);
    return events;
  });
}
