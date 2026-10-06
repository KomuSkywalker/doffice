export const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export const MONTH_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export const WEEKDAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

export const WEEKDAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export type DayCell = {
  key: string;
  day: number;
  month: number;
  year: number;
  inMonth: boolean;
  weekday: number;
};

export function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

export function makeKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function parseKey(key: string) {
  const parts = key.split("-");
  return {
    year: Number(parts[0]),
    month: Number(parts[1]) - 1,
    day: Number(parts[2]),
  };
}

export function isValidKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const { year, month, day } = parseKey(value);
  if (year < 1900 || year > 2200 || month < 0 || month > 11) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function weekdayOf(year: number, month: number, day: number) {
  return (new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7;
}

export function weekdayOfKey(key: string) {
  const { year, month, day } = parseKey(key);
  return weekdayOf(year, month, day);
}

export function todayKey() {
  const now = new Date();
  return makeKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function monthCells(year: number, month: number): DayCell[] {
  const offset = weekdayOf(year, month, 1);
  const total = daysInMonth(year, month);
  const rows = Math.ceil((offset + total) / 7);
  const cells: DayCell[] = [];
  for (let slot = 0; slot < rows * 7; slot += 1) {
    const dayNumber = slot - offset + 1;
    const stamp = new Date(Date.UTC(year, month, dayNumber));
    const cellYear = stamp.getUTCFullYear();
    const cellMonth = stamp.getUTCMonth();
    const cellDay = stamp.getUTCDate();
    cells.push({
      key: makeKey(cellYear, cellMonth, cellDay),
      day: cellDay,
      month: cellMonth,
      year: cellYear,
      inMonth: dayNumber >= 1 && dayNumber <= total,
      weekday: slot % 7,
    });
  }
  return cells;
}

export function shiftKey(key: string, days: number) {
  const { year, month, day } = parseKey(key);
  const stamp = new Date(Date.UTC(year, month, day + days));
  return makeKey(stamp.getUTCFullYear(), stamp.getUTCMonth(), stamp.getUTCDate());
}

export function shiftMonth(year: number, month: number, delta: number) {
  const stamp = new Date(Date.UTC(year, month + delta, 1));
  return { year: stamp.getUTCFullYear(), month: stamp.getUTCMonth() };
}

export function dayDiff(from: string, to: string) {
  const a = parseKey(from);
  const b = parseKey(to);
  const first = Date.UTC(a.year, a.month, a.day);
  const second = Date.UTC(b.year, b.month, b.day);
  return Math.round((second - first) / 86400000);
}

export function formatLong(key: string) {
  const { year, month, day } = parseKey(key);
  return `${day} ${MONTH_NAMES[month]} ${year}, ${WEEKDAY_NAMES[weekdayOf(year, month, day)]}`;
}

export function formatMedium(key: string) {
  const { year, month, day } = parseKey(key);
  return `${day} ${MONTH_SHORT[month]} ${year}`;
}

export function formatShort(key: string) {
  const { month, day } = parseKey(key);
  return `${day} ${MONTH_SHORT[month]}`;
}

export function relativeLabel(key: string, reference: string) {
  const diff = dayDiff(reference, key);
  if (diff === 0) return "bugün";
  if (diff === 1) return "yarın";
  if (diff === -1) return "dün";
  if (diff > 1) return `${diff} gün sonra`;
  return `${Math.abs(diff)} gün önce`;
}

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toClock(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
