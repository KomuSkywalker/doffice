"use client";

import { MONTH_NAMES, WEEKDAY_NAMES, WEEKDAY_SHORT, monthCells } from "@/lib/dates";
import type { AlmanakEvent } from "@/lib/types";
import { tagOf } from "@/lib/types";

type Props = {
  year: number;
  month: number;
  index: Map<string, AlmanakEvent[]>;
  today: string;
  selected: string | null;
  onSelect: (key: string) => void;
};

export function MonthView({
  year,
  month,
  index,
  today,
  selected,
  onSelect,
}: Props) {
  const cells = monthCells(year, month);
  const gridKey = `${year}-${month}`;

  return (
    <section
      aria-label={`${MONTH_NAMES[month]} ${year} takvimi`}
      className="nb overflow-hidden rounded-lg bg-ink shadow-nb"
    >
      <div key={gridKey} className="grid grid-cols-7 gap-[2px] bg-ink">
        {WEEKDAY_NAMES.map((label, slot) => (
          <div
            key={label}
            className={`px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.1em] ${
              slot > 4 ? "bg-peach-deep" : "bg-peach"
            }`}
          >
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{WEEKDAY_SHORT[slot]}</span>
          </div>
        ))}

        {cells.map((cell, position) => {
          const dayEvents = index.get(cell.key) ?? [];
          const isToday = cell.key === today;
          const isSelected = cell.key === selected;
          const weekend = cell.weekday > 4;
          const shown = dayEvents.slice(0, 4);
          const rest = dayEvents.length - shown.length;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelect(cell.key)}
              aria-current={isToday ? "date" : undefined}
              style={{ animationDelay: `${Math.min(position, 41) * 9}ms` }}
              className={`cell-pop anim-fade group relative flex min-h-[86px] flex-col gap-1.5 p-2 text-left sm:min-h-[128px] sm:p-2.5 xl:min-h-[148px] ${
                isToday
                  ? "bg-yellow"
                  : cell.inMonth
                    ? weekend
                      ? "bg-cream hover:bg-peach-soft"
                      : "bg-card hover:bg-peach-soft"
                    : "bg-peach-soft hover:bg-peach-deep"
              } ${isSelected && !isToday ? "ring-[3px] ring-inset ring-blue" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span
                  className={`tabular text-base font-bold leading-none ${
                    cell.inMonth ? "" : "text-muted"
                  }`}
                >
                  {cell.day}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="nb-thin tabular rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-bold text-peach">
                    {dayEvents.length}
                  </span>
                ) : null}
              </span>

              <span className="hidden flex-1 flex-col gap-1 sm:flex">
                {shown.map((event) => (
                  <span
                    key={event.id}
                    className="nb-thin flex items-center gap-1 overflow-hidden rounded-sm px-1.5 py-[3px] text-[11px] font-bold leading-tight text-ink"
                    style={{ backgroundColor: tagOf(event.tag).color }}
                  >
                    {event.time ? (
                      <span className="tabular shrink-0">{event.time}</span>
                    ) : null}
                    <span className={`truncate ${event.done ? "line-through" : ""}`}>
                      {event.title}
                    </span>
                  </span>
                ))}
                {rest > 0 ? (
                  <span className="px-0.5 text-[11px] font-bold text-muted">
                    {rest} kayıt daha
                  </span>
                ) : null}
              </span>

              <span className="flex flex-wrap items-center gap-1 sm:hidden">
                {dayEvents.slice(0, 4).map((event) => (
                  <span
                    key={event.id}
                    aria-hidden
                    className="h-2 w-2 rounded-full border border-ink"
                    style={{ backgroundColor: tagOf(event.tag).color }}
                  />
                ))}
              </span>

              {dayEvents.length > 0 ? (
                <span className="sr-only">{dayEvents.length} kayıt</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
