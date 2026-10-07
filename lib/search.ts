import { sortEvents } from "./occurrences";
import { siteName } from "./types";
import type {
  DofficeEvent,
  Project,
  Routine,
  Shortcut,
} from "./types";

export type SearchHit = {
  kind: "kayit" | "rutin" | "proje" | "kisayol" | "dosya";
  id: string;
  title: string;
  sub: string;
  color: string;
  date?: string;
  url?: string;
};

export type SearchSource = {
  events: DofficeEvent[];
  routines: Routine[];
  projects: Project[];
  shortcuts: Shortcut[];
};

const KIND_LIMIT = 12;

function fold(value: string) {
  return value.toLocaleLowerCase("tr");
}

function hits(needle: string, ...parts: (string | null | undefined)[]) {
  return parts.some((part) => (part ? fold(part).includes(needle) : false));
}

export function searchAll(source: SearchSource, query: string): SearchHit[] {
  const needle = fold(query.trim());
  if (needle.length === 0) return [];

  const found: SearchHit[] = [];

  const events = sortEvents(
    source.events.filter((event) =>
      hits(needle, event.title, event.note, event.label),
    ),
  )
    .sort((left, right) => (left.date < right.date ? -1 : 1))
    .slice(0, KIND_LIMIT);

  for (const event of events) {
    found.push({
      kind: "kayit",
      id: event.id,
      title: event.title,
      sub: event.time ? `${event.time}` : "gün boyu",
      color: event.color,
      date: event.date,
    });
  }

  for (const routine of source.routines.filter((row) =>
    hits(needle, row.title, row.note, row.label),
  ).slice(0, KIND_LIMIT)) {
    found.push({
      kind: "rutin",
      id: routine.id,
      title: routine.title,
      sub: `${routine.start} - ${routine.end}`,
      color: routine.color,
    });
  }

  for (const project of source.projects
    .filter(
      (row) =>
        hits(needle, row.name, row.note) ||
        row.steps.some((step) => hits(needle, step.title)),
    )
    .slice(0, KIND_LIMIT)) {
    const next = project.steps.find((step) => !step.done)?.title;
    found.push({
      kind: "proje",
      id: project.id,
      title: project.name,
      sub: next ?? project.status,
      color: project.color,
    });
  }

  for (const project of source.projects) {
    for (const file of project.files) {
      if (!hits(needle, file.label, file.url)) continue;
      found.push({
        kind: "dosya",
        id: file.id,
        title: file.label,
        sub: project.name,
        color: project.color,
        url: file.url,
      });
    }
  }

  for (const shortcut of source.shortcuts.filter((row) =>
    hits(needle, row.label, row.url),
  ).slice(0, KIND_LIMIT)) {
    found.push({
      kind: "kisayol",
      id: shortcut.id,
      title: shortcut.label,
      sub: siteName(shortcut.url),
      color: shortcut.color,
      url: shortcut.url,
    });
  }

  return found;
}

export const KIND_LABELS: Record<SearchHit["kind"], string> = {
  kayit: "kayıt",
  rutin: "rutin",
  proje: "proje",
  dosya: "dosya",
  kisayol: "kısayol",
};
