import { shiftKey, toClock, toMinutes, WEEKDAY_SHORT, weekdayOfKey } from "./dates";
import { eventsOn, sortEvents } from "./occurrences";
import type { DofficeEvent, Routine } from "./types";

export function routineOccursOn(routine: Routine, key: string) {
  if (!routine.active) return false;
  if (routine.from && key < routine.from) return false;
  if (routine.until && key > routine.until) return false;
  return routine.days.includes(weekdayOfKey(key));
}

export function routinesOn(routines: Routine[], key: string) {
  return routines
    .filter((routine) => routineOccursOn(routine, key))
    .sort((left, right) => (left.start < right.start ? -1 : 1));
}

export function routineRanges(routines: Routine[], key: string) {
  return routinesOn(routines, key).map((routine) => ({
    start: toMinutes(routine.start),
    end: toMinutes(routine.end),
  }));
}

export function routineMinutes(routine: Routine) {
  return Math.max(toMinutes(routine.end) - toMinutes(routine.start), 5);
}

export function routineInstance(routine: Routine, key: string): DofficeEvent {
  return {
    id: `rutin:${routine.id}:${key}`,
    date: key,
    time: routine.start,
    duration: routineMinutes(routine),
    title: routine.title,
    note: routine.note,
    tag: routine.tag,
    repeat: "yok",
    done: false,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
    routineId: routine.id,
  };
}

export function isRoutineItem(event: DofficeEvent) {
  return typeof event.routineId === "string";
}

export function dayItems(
  events: DofficeEvent[],
  routines: Routine[],
  key: string,
) {
  const instances = routinesOn(routines, key).map((routine) =>
    routineInstance(routine, key),
  );
  if (instances.length === 0) return eventsOn(events, key);
  return sortEvents([...eventsOn(events, key), ...instances]);
}

export function indexRangeWithRoutines(
  events: DofficeEvent[],
  routines: Routine[],
  startKey: string,
  endKey: string,
) {
  const index = new Map<string, DofficeEvent[]>();
  let cursor = startKey;
  let guard = 0;
  while (cursor <= endKey && guard < 800) {
    const found = dayItems(events, routines, cursor);
    if (found.length > 0) index.set(cursor, found);
    cursor = shiftKey(cursor, 1);
    guard += 1;
  }
  return index;
}

export function spanLabel(routine: Routine) {
  return `${routine.start} - ${routine.end}`;
}

export function daysLabel(days: number[]) {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 0) return "Gün seçilmedi";
  if (sorted.length === 7) return "Her gün";
  if (sorted.length === 5 && sorted.every((day, index) => day === index)) {
    return "Hafta içi";
  }
  if (sorted.length === 2 && sorted[0] === 5 && sorted[1] === 6) {
    return "Hafta sonu";
  }
  return sorted.map((day) => WEEKDAY_SHORT[day]).join(", ");
}

export function itemSpan(event: DofficeEvent) {
  if (!event.time) return null;
  return `${event.time} - ${toClock(toMinutes(event.time) + event.duration)}`;
}
