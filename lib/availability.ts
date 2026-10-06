import { isValidKey, isValidTime, shiftKey, toClock, toMinutes, weekdayOfKey } from "./dates";
import { occursOn } from "./occurrences";
import { routineRanges } from "./routines";
import type { Appointment, Availability, DofficeEvent, Routine } from "./types";

export type Slot = { time: string; endTime: string; free: boolean };

export type DaySlots = { key: string; slots: Slot[]; free: number };

export type Schedule = {
  availability: Availability;
  events: DofficeEvent[];
  appointments: Appointment[];
  routines: Routine[];
};

export { toClock, toMinutes };

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function busyRanges(schedule: Schedule, key: string) {
  const ranges: { start: number; end: number }[] = [];

  for (const event of schedule.events) {
    if (!event.time) continue;
    if (!occursOn(event, key)) continue;
    const start = toMinutes(event.time);
    ranges.push({ start, end: start + event.duration });
  }

  for (const appointment of schedule.appointments) {
    if (appointment.date !== key) continue;
    if (appointment.status === "reddedildi") continue;
    const start = toMinutes(appointment.time);
    ranges.push({ start, end: start + appointment.duration });
  }

  for (const range of routineRanges(schedule.routines, key)) {
    ranges.push(range);
  }

  return ranges;
}

export function slotsForDay(
  schedule: Schedule,
  key: string,
  nowKey: string,
  nowMinutes: number,
): Slot[] {
  if (!isValidKey(key)) return [];
  if (key < nowKey) return [];
  if (!schedule.availability.days.includes(weekdayOfKey(key))) return [];

  const dayStart = toMinutes(schedule.availability.start);
  const dayEnd = toMinutes(schedule.availability.end);
  const step = schedule.availability.slotMinutes;
  if (step <= 0 || dayEnd <= dayStart) return [];

  const busy = busyRanges(schedule, key);
  const slots: Slot[] = [];

  for (let start = dayStart; start + step <= dayEnd; start += step) {
    if (key === nowKey && start <= nowMinutes) continue;
    const end = start + step;
    const blocked = busy.some((range) =>
      overlaps(start, end, range.start, range.end),
    );
    slots.push({ time: toClock(start), endTime: toClock(end), free: !blocked });
  }

  return slots;
}

export function freeSlotsForDay(
  schedule: Schedule,
  key: string,
  nowKey: string,
  nowMinutes: number,
) {
  return slotsForDay(schedule, key, nowKey, nowMinutes).filter(
    (slot) => slot.free,
  );
}

export function availableDays(
  schedule: Schedule,
  fromKey: string,
  monthPrefix: string,
  nowKey: string,
  nowMinutes: number,
): DaySlots[] {
  const result: DaySlots[] = [];
  let cursor = fromKey;
  for (let step = 0; step < schedule.availability.horizonDays; step += 1) {
    if (cursor.startsWith(monthPrefix)) {
      const slots = slotsForDay(schedule, cursor, nowKey, nowMinutes);
      if (slots.length > 0) {
        result.push({
          key: cursor,
          slots,
          free: slots.filter((slot) => slot.free).length,
        });
      }
    }
    cursor = shiftKey(cursor, 1);
  }
  return result;
}

export function slotIsFree(
  schedule: Schedule,
  key: string,
  time: string,
  nowKey: string,
  nowMinutes: number,
) {
  if (!isValidTime(time)) return false;
  return slotsForDay(schedule, key, nowKey, nowMinutes).some(
    (slot) => slot.time === time && slot.free,
  );
}
