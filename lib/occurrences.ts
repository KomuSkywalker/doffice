import type { DofficeEvent } from "./types";
import { daysInMonth, parseKey, shiftKey, weekdayOfKey } from "./dates";

export function occursOn(event: DofficeEvent, key: string) {
  if (event.date === key) return true;
  if (event.repeat === "yok" || key < event.date) return false;

  if (event.repeat === "haftalik") {
    return weekdayOfKey(event.date) === weekdayOfKey(key);
  }

  const base = parseKey(event.date);
  const target = parseKey(key);

  if (event.repeat === "aylik") {
    const lastDay = daysInMonth(target.year, target.month);
    const expected = Math.min(base.day, lastDay);
    return target.day === expected;
  }

  if (event.repeat === "yillik") {
    if (base.month === 1 && base.day === 29) {
      const lastDay = daysInMonth(target.year, 1);
      return target.month === 1 && target.day === Math.min(29, lastDay);
    }
    return target.month === base.month && target.day === base.day;
  }

  return false;
}

export function sortEvents(events: DofficeEvent[]) {
  return [...events].sort((left, right) => {
    if (left.time && right.time && left.time !== right.time) {
      return left.time < right.time ? -1 : 1;
    }
    if (left.time && !right.time) return -1;
    if (!left.time && right.time) return 1;
    return left.title.localeCompare(right.title, "tr");
  });
}

export function eventsOn(events: DofficeEvent[], key: string) {
  return sortEvents(events.filter((event) => occursOn(event, key)));
}

export function indexRange(
  events: DofficeEvent[],
  startKey: string,
  endKey: string,
) {
  const index = new Map<string, DofficeEvent[]>();
  let cursor = startKey;
  let guard = 0;
  while (cursor <= endKey && guard < 800) {
    const found = eventsOn(events, cursor);
    if (found.length > 0) index.set(cursor, found);
    cursor = shiftKey(cursor, 1);
    guard += 1;
  }
  return index;
}

export function upcoming(
  events: DofficeEvent[],
  fromKey: string,
  dayCount: number,
) {
  const days: { key: string; events: DofficeEvent[] }[] = [];
  let cursor = fromKey;
  for (let step = 0; step < dayCount; step += 1) {
    const found = eventsOn(events, cursor).filter((event) => !event.done);
    if (found.length > 0) days.push({ key: cursor, events: found });
    cursor = shiftKey(cursor, 1);
  }
  return days;
}

export function searchEvents(events: DofficeEvent[], query: string) {
  const needle = query.trim().toLocaleLowerCase("tr");
  if (needle.length === 0) return [];
  return sortEvents(
    events.filter((event) => {
      const haystack = `${event.title} ${event.note ?? ""}`.toLocaleLowerCase(
        "tr",
      );
      return haystack.includes(needle);
    }),
  ).sort((left, right) => (left.date < right.date ? -1 : 1));
}
