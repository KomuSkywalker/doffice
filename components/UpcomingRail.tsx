"use client";

import { formatShort, relativeLabel, WEEKDAY_SHORT, weekdayOfKey } from "@/lib/dates";
import { eventsOn, upcoming } from "@/lib/occurrences";
import type { AlmanakEvent } from "@/lib/types";
import { TagDot } from "./ui";

type Props = {
  events: AlmanakEvent[];
  today: string;
  onSelect: (key: string) => void;
};

function Row({
  event,
  onSelect,
}: {
  event: AlmanakEvent;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sunk"
    >
      <span className="mt-1.5">
        <TagDot tag={event.tag} size={6} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13px] font-medium ${
            event.done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {event.title}
        </span>
        {event.time ? (
          <span className="tabular block text-[11px] text-muted">
            {event.time}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function UpcomingRail({ events, today, onSelect }: Props) {
  const todayEvents = eventsOn(events, today);
  const nextDays = upcoming(events, today, 46).filter((day) => day.key !== today);
  const overdue = events
    .filter(
      (event) => event.repeat === "yok" && !event.done && event.date < today,
    )
    .sort((left, right) => (left.date > right.date ? -1 : 1))
    .slice(0, 6);

  return (
    <aside className="space-y-4 no-print">
      <section className="rounded-lg border border-line bg-surface p-3 shadow-paper">
        <h2 className="mb-2 font-display text-[15px] font-semibold">
          Bugün
        </h2>
        {todayEvents.length === 0 ? (
          <p className="px-2 py-1 text-[13px] text-muted">
            Bugün için kayıt yok.
          </p>
        ) : (
          <div className="space-y-0.5">
            {todayEvents.map((event) => (
              <Row
                key={event.id}
                event={event}
                onSelect={() => onSelect(today)}
              />
            ))}
          </div>
        )}
      </section>

      {overdue.length > 0 ? (
        <section className="rounded-lg border border-accent-soft bg-accent-soft/40 p-3">
          <h2 className="mb-2 font-display text-[15px] font-semibold text-accent-ink">
            Gecikenler
          </h2>
          <div className="space-y-0.5">
            {overdue.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelect(event.date)}
                className="flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface/70"
              >
                <span className="tabular w-12 shrink-0 text-[11px] font-medium text-accent-ink">
                  {formatShort(event.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {event.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-surface p-3 shadow-paper">
        <h2 className="mb-2 font-display text-[15px] font-semibold">
          Yaklaşanlar
        </h2>
        {nextDays.length === 0 ? (
          <p className="px-2 py-1 text-[13px] text-muted">
            Önümüzdeki altı haftada kayıt yok.
          </p>
        ) : (
          <div className="scroll-thin max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {nextDays.slice(0, 14).map((day) => (
              <div key={day.key}>
                <button
                  type="button"
                  onClick={() => onSelect(day.key)}
                  className="mb-0.5 flex w-full items-baseline justify-between gap-2 px-2 text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    {formatShort(day.key)}{" "}
                    {WEEKDAY_SHORT[weekdayOfKey(day.key)]}
                  </span>
                  <span className="text-[11px] text-muted">
                    {relativeLabel(day.key, today)}
                  </span>
                </button>
                <div className="space-y-0.5">
                  {day.events.map((event) => (
                    <Row
                      key={event.id}
                      event={event}
                      onSelect={() => onSelect(day.key)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
