"use client";

import {
  MONTH_NAMES,
  formatLong,
  formatShort,
  makeKey,
  parseKey,
  relativeLabel,
  WEEKDAY_SHORT,
  weekdayOfKey,
} from "@/lib/dates";
import { indexRange, upcoming } from "@/lib/occurrences";
import { dayItems, itemSpan } from "@/lib/routines";
import type { DofficeEvent, Routine } from "@/lib/types";
import { Card, TagChip, TagDot } from "./ui";

type Props = {
  events: DofficeEvent[];
  routines: Routine[];
  today: string;
  onSelect: (key: string) => void;
  onToggleDone: (event: DofficeEvent) => void;
};

function Tile({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: number;
  accent: string;
  delay: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`lift anim-pop nb rounded-lg px-4 py-3.5 shadow-nb ${accent}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{label}</p>
      <p className="tabular mt-1 text-3xl font-bold leading-none">{value}</p>
    </div>
  );
}

export function DashboardView({
  events,
  routines,
  today,
  onSelect,
  onToggleDone,
}: Props) {
  const todayEvents = dayItems(events, routines, today);
  const nextDays = upcoming(events, today, 15).filter((day) => day.key !== today);
  const overdue = events
    .filter((event) => event.repeat === "yok" && !event.done && event.date < today)
    .sort((left, right) => (left.date > right.date ? -1 : 1));

  const parts = parseKey(today);
  const monthIndex = indexRange(
    events,
    makeKey(parts.year, parts.month, 1),
    makeKey(parts.year, parts.month, 31),
  );
  let monthCount = 0;
  for (const dayEvents of monthIndex.values()) monthCount += dayEvents.length;

  const weekCount = upcoming(events, today, 7).reduce(
    (total, day) => total + day.events.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Bugün"
          value={todayEvents.length}
          accent="bg-gold"
          delay={0}
        />
        <Tile
          label="Geciken"
          value={overdue.length}
          accent="bg-gold"
          delay={60}
        />
        <Tile
          label="Yedi günde"
          value={weekCount}
          accent="bg-gold"
          delay={120}
        />
        <Tile
          label={`${MONTH_NAMES[parts.month]} ayı`}
          value={monthCount}
          accent="bg-gold"
          delay={180}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title="Bugünün programı"
          accent="bg-gold"
          className="min-w-0"
          action={
            <button
              type="button"
              onClick={() => onSelect(today)}
              className="chip-pop nb-thin rounded-sm bg-card px-2 py-1 text-[11px] font-bold text-ink"
            >
              Güne git
            </button>
          }
        >
          <div className="px-4 py-4">
            <p className="mb-3 text-sm font-bold text-muted">
              {formatLong(today)}
            </p>
            {todayEvents.length === 0 ? (
              <p className="nb-thin rounded-md border-dashed bg-tint/60 px-4 py-8 text-center text-sm font-bold">
                Bugün temiz. Yeni kayıt ekleyebilirsin.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {todayEvents.map((event, position) => (
                  <li
                    key={event.id}
                    style={{ animationDelay: `${position * 45}ms` }}
                    className="anim-rise nb-thin flex items-start gap-3 rounded-md bg-cream px-3 py-2.5"
                  >
                    {event.repeat === "yok" && !event.routineId ? (
                      <input
                        type="checkbox"
                        checked={event.done}
                        onChange={() => onToggleDone(event)}
                        aria-label={`${event.title} tamamlandı`}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
                      />
                    ) : (
                      <span className="mt-1 w-4 shrink-0">
                        <TagDot tag={event.tag} size={10} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        {event.time ? (
                          <span className="tabular text-sm font-bold text-rust">
                            {event.routineId ? itemSpan(event) : event.time}
                          </span>
                        ) : null}
                        <span
                          className={`text-sm font-bold transition-all duration-200 ${
                            event.done ? "text-muted line-through opacity-70" : ""
                          }`}
                        >
                          {event.title}
                        </span>
                        {event.routineId ? (
                          <span className="nb-thin rounded-sm bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            rutin
                          </span>
                        ) : null}
                      </span>
                      {event.note ? (
                        <span className="mt-0.5 block text-[13px] font-medium text-ink-soft">
                          {event.note}
                        </span>
                      ) : null}
                    </span>
                    <TagChip tag={event.tag} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          {overdue.length > 0 ? (
            <Card title="Gecikenler" accent="bg-gold">
              <ul className="divide-y-2 divide-ink/10 px-2 py-1.5">
                {overdue.slice(0, 6).map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(event.date)}
                      className="row-slide flex w-full items-center gap-2.5 rounded-sm px-2 py-2.5 text-left hover:bg-tint"
                    >
                      <span className="tabular w-14 shrink-0 text-xs font-bold text-rust">
                        {formatShort(event.date)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">
                        {event.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title="Yaklaşanlar" accent="bg-gold">
            <div className="scroll-thin max-h-[460px] space-y-4 overflow-y-auto px-4 py-4">
              {nextDays.length === 0 ? (
                <p className="text-sm font-medium text-muted">
                  Önümüzdeki iki haftada kayıt yok.
                </p>
              ) : (
                nextDays.map((day) => (
                  <div key={day.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(day.key)}
                      className="mb-1 flex w-full items-baseline justify-between gap-2 text-left"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                        {formatShort(day.key)} {WEEKDAY_SHORT[weekdayOfKey(day.key)]}
                      </span>
                      <span className="text-[11px] font-medium text-muted">
                        {relativeLabel(day.key, today)}
                      </span>
                    </button>
                    <ul className="space-y-1.5">
                      {day.events.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(day.key)}
                            className="row-slide nb-thin flex w-full items-center gap-2 rounded-sm bg-cream px-2.5 py-1.5 text-left"
                          >
                            <TagDot tag={event.tag} size={10} />
                            <span className="min-w-0 flex-1 truncate text-[13px] font-bold">
                              {event.title}
                            </span>
                            {event.time ? (
                              <span className="tabular shrink-0 text-[11px] font-bold text-muted">
                                {event.time}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
