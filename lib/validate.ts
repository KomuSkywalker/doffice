import { isValidKey, isValidTime } from "./dates";
import {
  DEFAULT_AVAILABILITY,
  DURATIONS,
  REPEAT_IDS,
  TAG_IDS,
  type Availability,
  type DofficeEvent,
  type EventDraft,
  type Repeat,
  type Routine,
  type RoutineDraft,
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

  if (body.duration !== undefined) {
    const duration = Number(body.duration);
    if (!DURATIONS.includes(duration)) {
      return { ok: false, error: "Geçersiz süre." };
    }
    draft.duration = duration;
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

export function isEventShape(value: unknown): value is DofficeEvent {
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

export type AppointmentInput = {
  date: string;
  time: string;
  name: string;
  contact: string;
  note: string | null;
};

export type AppointmentResult =
  | { ok: true; value: AppointmentInput }
  | { ok: false; error: string };

export function parseAppointment(input: unknown): AppointmentResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const body = input as Record<string, unknown>;

  if (typeof body.sirket === "string" && body.sirket.trim().length > 0) {
    return { ok: false, error: "İstek reddedildi." };
  }

  if (!isValidKey(body.date)) {
    return { ok: false, error: "Gün seçilmedi." };
  }
  if (!isValidTime(body.time)) {
    return { ok: false, error: "Saat seçilmedi." };
  }

  const name = asTrimmed(body.name);
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "Ad soyad iki ile seksen karakter arası olmalı." };
  }

  const contact = asTrimmed(body.contact);
  if (contact.length < 5 || contact.length > 120) {
    return { ok: false, error: "Telefon veya e-posta gerekli." };
  }

  const note = asTrimmed(body.note);
  if (note.length > 500) {
    return { ok: false, error: "Not en fazla 500 karakter." };
  }

  return {
    ok: true,
    value: {
      date: body.date,
      time: body.time,
      name,
      contact,
      note: note.length === 0 ? null : note,
    },
  };
}

export type AvailabilityResult =
  | { ok: true; value: Availability }
  | { ok: false; error: string };

export function parseAvailability(input: unknown): AvailabilityResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const body = input as Record<string, unknown>;

  const days = Array.isArray(body.days)
    ? body.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : null;
  if (!days) {
    return { ok: false, error: "Çalışma günleri geçersiz." };
  }

  if (!isValidTime(body.start) || !isValidTime(body.end)) {
    return { ok: false, error: "Çalışma saatleri SS:DD biçiminde olmalı." };
  }
  if (String(body.start) >= String(body.end)) {
    return { ok: false, error: "Bitiş saati başlangıçtan sonra olmalı." };
  }

  const slotMinutes = Number(body.slotMinutes);
  if (!DURATIONS.includes(slotMinutes)) {
    return { ok: false, error: "Randevu süresi geçersiz." };
  }

  const horizonDays = Number(body.horizonDays);
  if (!Number.isInteger(horizonDays) || horizonDays < 7 || horizonDays > 180) {
    return { ok: false, error: "Görünür gün sayısı 7 ile 180 arasında olmalı." };
  }

  const note = asTrimmed(body.note);
  if (note.length > 300) {
    return { ok: false, error: "Not en fazla 300 karakter." };
  }

  return {
    ok: true,
    value: {
      ...DEFAULT_AVAILABILITY,
      days: [...new Set(days)].sort((a, b) => a - b),
      start: body.start,
      end: body.end,
      slotMinutes,
      horizonDays,
      note,
    },
  };
}

export function isRoutineShape(value: unknown): value is Routine {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    Array.isArray(row.days) &&
    isValidTime(row.start) &&
    isValidTime(row.end) &&
    TAG_IDS.includes(row.tag as TagId)
  );
}

export type RoutineResult =
  | { ok: true; value: RoutineDraft }
  | { ok: false; error: string };

const ROUTINE_TITLE_LIMIT = 120;
const ROUTINE_NOTE_LIMIT = 300;

export function parseRoutine(input: unknown, partial: boolean): RoutineResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const body = input as Record<string, unknown>;
  const draft: Partial<RoutineDraft> = {};

  if (body.title !== undefined || !partial) {
    const title = asTrimmed(body.title);
    if (title.length === 0) {
      return { ok: false, error: "Rutin adı boş olamaz." };
    }
    if (title.length > ROUTINE_TITLE_LIMIT) {
      return {
        ok: false,
        error: `Rutin adı en fazla ${ROUTINE_TITLE_LIMIT} karakter.`,
      };
    }
    draft.title = title;
  }

  if (body.days !== undefined || !partial) {
    const days = Array.isArray(body.days)
      ? body.days
          .map(Number)
          .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      : [];
    if (days.length === 0) {
      return { ok: false, error: "En az bir gün seç." };
    }
    draft.days = [...new Set(days)].sort((a, b) => a - b);
  }

  if (body.start !== undefined || !partial) {
    if (!isValidTime(body.start)) {
      return { ok: false, error: "Başlangıç saati SS:DD biçiminde olmalı." };
    }
    draft.start = body.start;
  }

  if (body.end !== undefined || !partial) {
    if (!isValidTime(body.end)) {
      return { ok: false, error: "Bitiş saati SS:DD biçiminde olmalı." };
    }
    draft.end = body.end;
  }

  if (
    draft.start !== undefined &&
    draft.end !== undefined &&
    draft.start >= draft.end
  ) {
    return { ok: false, error: "Bitiş saati başlangıçtan sonra olmalı." };
  }

  if (body.tag !== undefined || !partial) {
    const tag = body.tag ?? "genel";
    if (!TAG_IDS.includes(tag as TagId)) {
      return { ok: false, error: "Bilinmeyen etiket." };
    }
    draft.tag = tag as TagId;
  }

  if (body.note !== undefined || !partial) {
    const note = body.note === null ? "" : asTrimmed(body.note);
    if (note.length > ROUTINE_NOTE_LIMIT) {
      return { ok: false, error: `Not en fazla ${ROUTINE_NOTE_LIMIT} karakter.` };
    }
    draft.note = note.length === 0 ? null : note;
  }

  for (const field of ["from", "until"] as const) {
    if (body[field] === undefined && partial) continue;
    const raw = body[field];
    if (raw === null || asTrimmed(raw).length === 0) {
      draft[field] = null;
      continue;
    }
    if (!isValidKey(raw)) {
      return { ok: false, error: "Tarih YYYY-AA-GG biçiminde olmalı." };
    }
    draft[field] = raw;
  }

  if (draft.from && draft.until && draft.from > draft.until) {
    return { ok: false, error: "Son gün ilk günden sonra olmalı." };
  }

  if (body.active !== undefined || !partial) {
    const active = body.active === undefined ? true : body.active;
    if (typeof active !== "boolean") {
      return { ok: false, error: "Durum değeri boolean olmalı." };
    }
    draft.active = active;
  }

  return { ok: true, value: draft as RoutineDraft };
}
