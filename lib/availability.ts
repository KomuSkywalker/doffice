import { isValidKey, isValidTime, shiftKey, weekdayOfKey } from "./dates";
import { occursOn } from "./occurrences";
import type { Appointment, Availability, DofficeEvent } from "./types";

export type Slot = { time: string; endTime: string };

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toClock(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && startB < endA;
}

function busyRanges(
  events: DofficeEvent[],
  appointments: Appointment[],
  key: string,
) {
  const ranges: { start: number; end: number }[] = [];

  for (const event of events) {
    if (!event.time) continue;
    if (!occursOn(event, key)) continue;
    const start = toMinutes(event.time);
    ranges.push({ start, end: start + event.duration });
  }

  for (const appointment of appointments) {
    if (appointment.date !== key) continue;
    if (appointment.status === "reddedildi") continue;
    const start = toMinutes(appointment.time);
    ranges.push({ start, end: start + appointment.duration });
  }

  return ranges;
}

export function slotsForDay(
  availability: Availability,
  events: DofficeEvent[],
  appointments: Appointment[],
  key: string,
  nowKey: string,
  nowMinutes: number,
): Slot[] {
  if (!isValidKey(key)) return [];
  if (key < nowKey) return [];
  if (!availability.days.includes(weekdayOfKey(key))) return [];

  const dayStart = toMinutes(availability.start);
  const dayEnd = toMinutes(availability.end);
  const step = availability.slotMinutes;
  if (step <= 0 || dayEnd <= dayStart) return [];

  const busy = busyRanges(events, appointments, key);
  const slots: Slot[] = [];

  for (let start = dayStart; start + step <= dayEnd; start += step) {
    if (key === nowKey && start <= nowMinutes) continue;
    const end = start + step;
    const blocked = busy.some((range) =>
      overlaps(start, end, range.start, range.end),
    );
    if (blocked) continue;
    slots.push({ time: toClock(start), endTime: toClock(end) });
  }

  return slots;
}

export function availableDays(
  availability: Availability,
  events: DofficeEvent[],
  appointments: Appointment[],
  fromKey: string,
  monthPrefix: string,
  nowKey: string,
  nowMinutes: number,
) {
  const result: { key: string; slots: Slot[] }[] = [];
  let cursor = fromKey;
  for (let step = 0; step < availability.horizonDays; step += 1) {
    if (cursor.startsWith(monthPrefix)) {
      const slots = slotsForDay(
        availability,
        events,
        appointments,
        cursor,
        nowKey,
        nowMinutes,
      );
      if (slots.length > 0) result.push({ key: cursor, slots });
    }
    cursor = shiftKey(cursor, 1);
  }
  return result;
}

export function slotIsFree(
  availability: Availability,
  events: DofficeEvent[],
  appointments: Appointment[],
  key: string,
  time: string,
  nowKey: string,
  nowMinutes: number,
) {
  if (!isValidTime(time)) return false;
  return slotsForDay(
    availability,
    events,
    appointments,
    key,
    nowKey,
    nowMinutes,
  ).some((slot) => slot.time === time);
}
