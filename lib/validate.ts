import { isValidKey, isValidTime } from "./dates";
import {
  REPEAT_IDS,
  TAG_IDS,
  type AlmanakEvent,
  type EventDraft,
  type Repeat,
  type TagId,
} from "./types";

const TITLE_LIMIT = 160;
const NOTE_LIMIT = 2000;

export type ValidationResult =
  | { ok: true; value: EventDraft }
  | { ok: false; error: string };

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseDraft(input: unknown, partial: boolean): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const body = input as Record<string, unknown>;
  const draft: Partial<EventDraft> = {};

  if (body.date !== undefined || !partial) {
    if (!isValidKey(body.date)) {
      return { ok: false, error: "Tarih YYYY-AA-GG biçiminde olmalı." };
    }
    draft.date = body.date;
  }

  if (body.title !== undefined || !partial) {
    const title = asTrimmed(body.title);
    if (title.length === 0) {
      return { ok: false, error: "Başlık boş olamaz." };
    }
    if (title.length > TITLE_LIMIT) {
      return { ok: false, error: `Başlık en fazla ${TITLE_LIMIT} karakter.` };
    }
    draft.title = title;
  }

  if (body.time !== undefined) {
    if (body.time === null || asTrimmed(body.time).length === 0) {
      draft.time = null;
    } else if (isValidTime(body.time)) {
      draft.time = body.time;
    } else {
      return { ok: false, error: "Saat SS:DD biçiminde olmalı." };
    }
  }

  if (body.note !== undefined) {
    if (body.note === null) {
      draft.note = null;
    } else {
      const note = asTrimmed(body.note);
      if (note.length > NOTE_LIMIT) {
        return { ok: false, error: `Not en fazla ${NOTE_LIMIT} karakter.` };
      }
      draft.note = note.length === 0 ? null : note;
    }
  }

  if (body.tag !== undefined) {
    if (!TAG_IDS.includes(body.tag as TagId)) {
      return { ok: false, error: "Bilinmeyen etiket." };
    }
    draft.tag = body.tag as TagId;
  }

  if (body.repeat !== undefined) {
    if (!REPEAT_IDS.includes(body.repeat as Repeat)) {
      return { ok: false, error: "Bilinmeyen tekrar değeri." };
    }
    draft.repeat = body.repeat as Repeat;
  }

  if (body.done !== undefined) {
    if (typeof body.done !== "boolean") {
      return { ok: false, error: "Tamamlandı değeri boolean olmalı." };
    }
    draft.done = body.done;
  }

  return { ok: true, value: draft as EventDraft };
}

export function isEventShape(value: unknown): value is AlmanakEvent {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    isValidKey(row.date) &&
    typeof row.title === "string" &&
    TAG_IDS.includes(row.tag as TagId) &&
    REPEAT_IDS.includes(row.repeat as Repeat)
  );
}
