"use client";

import { useMemo, useState } from "react";
import { MONTH_NAMES, parseKey, WEEKDAY_SHORT, weekdayOfKey } from "@/lib/dates";
import { repeatLabel, TAGS, type AlmanakEvent, type TagId } from "@/lib/types";
import { Card, TagChip } from "./ui";

type Scope = "tumu" | "gelecek" | "gecmis" | "tamamlanan";

type Props = {
  events: AlmanakEvent[];
  today: string;
  onSelect: (key: string) => void;
};

const SCOPES: { id: Scope; label: string }[] = [
  { id: "tumu", label: "Tümü" },
  { id: "gelecek", label: "Bugün ve sonrası" },
  { id: "gecmis", label: "Geçmiş" },
  { id: "tamamlanan", label: "Tamamlananlar" },
];

export function ListView({ events, today, onSelect }: Props) {
  const [scope, setScope] = useState<Scope>("gelecek");
  const [tag, setTag] = useState<TagId | "hepsi">("hepsi");

  const rows = useMemo(() => {
    const filtered = events.filter((event) => {
      if (tag !== "hepsi" && event.tag !== tag) return false;
      if (scope === "gelecek") return event.date >= today || event.repeat !== "yok";
      if (scope === "gecmis") return event.date < today;
      if (scope === "tamamlanan") return event.done;
      return true;
    });
    return filtered.sort((left, right) => {
      if (left.date !== right.date) return left.date < right.date ? -1 : 1;
      if (left.time && right.time) return left.time < right.time ? -1 : 1;
      if (left.time) return -1;
      if (right.time) return 1;
      return left.title.localeCompare(right.title, "tr");
    });
  }, [events, scope, tag, today]);

  const groups = useMemo(() => {
    const map = new Map<string, AlmanakEvent[]>();
    for (const event of rows) {
      const key = event.date.slice(0, 7);
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="nb flex flex-col gap-3 rounded-lg bg-card px-4 py-3.5 shadow-nb">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Kapsam
          </span>
          {SCOPES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setScope(option.id)}
              aria-pressed={scope === option.id}
              className={`nb-thin rounded-sm px-2.5 py-1 text-xs font-bold ${
                scope === option.id ? "bg-ink text-peach" : "bg-card hover:bg-cream"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Etiket
          </span>
          <button
            type="button"
            onClick={() => setTag("hepsi")}
            aria-pressed={tag === "hepsi"}
            className={`nb-thin rounded-sm px-2.5 py-1 text-xs font-bold ${
              tag === "hepsi" ? "bg-ink text-peach" : "bg-card hover:bg-cream"
            }`}
          >
            Hepsi
          </button>
          {TAGS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTag(option.id)}
              aria-pressed={tag === option.id}
              className={`nb-thin rounded-sm px-2.5 py-1 text-xs font-bold text-ink ${
                tag === option.id ? "shadow-nb-xs" : "opacity-55 hover:opacity-100"
              }`}
              style={{ backgroundColor: option.color }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <p className="px-4 py-10 text-center text-sm font-bold text-muted">
            Bu filtreye uyan kayıt yok.
          </p>
        </Card>
      ) : (
        groups.map(([monthKey, monthRows]) => {
          const parts = parseKey(`${monthKey}-01`);
          return (
            <Card
              key={monthKey}
              title={`${MONTH_NAMES[parts.month]} ${parts.year}`}
              accent="bg-peach-soft"
              action={
                <span className="tabular text-xs font-bold text-muted">
                  {monthRows.length} kayıt
                </span>
              }
            >
              <ul>
                {monthRows.map((event) => {
                  const day = parseKey(event.date);
                  const isPast = event.date < today;
                  return (
                    <li
                      key={event.id}
                      className="border-b-2 border-ink/10 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(event.date)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-peach-soft/50"
                      >
                        <span
                          className={`nb-thin flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md ${
                            event.date === today
                              ? "bg-yellow"
                              : isPast
                                ? "bg-cream"
                                : "bg-card"
                          }`}
                        >
                          <span className="tabular text-base font-bold leading-none">
                            {day.day}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-muted">
                            {WEEKDAY_SHORT[weekdayOfKey(event.date)]}
                          </span>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-2">
                            {event.time ? (
                              <span className="tabular text-sm font-bold text-rust">
                                {event.time}
                              </span>
                            ) : null}
                            <span
                              className={`text-sm font-bold ${
                                event.done ? "text-muted line-through" : ""
                              }`}
                            >
                              {event.title}
                            </span>
                          </span>
                          {event.note ? (
                            <span className="mt-0.5 block truncate text-[13px] font-medium text-ink-soft">
                              {event.note}
                            </span>
                          ) : null}
                        </span>

                        <span className="hidden shrink-0 items-center gap-2 sm:flex">
                          {event.repeat !== "yok" ? (
                            <span className="nb-thin rounded-sm bg-cream px-2 py-0.5 text-[11px] font-bold">
                              {repeatLabel(event.repeat)}
                            </span>
                          ) : null}
                          <TagChip tag={event.tag} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })
      )}
    </div>
  );
}
