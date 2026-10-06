"use client";

import { MONTH_NAMES, WEEKDAY_SHORT, monthCells } from "@/lib/dates";
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

  return (
    <section
      aria-label={`${MONTH_NAMES[month]} ${year} takvimi`}
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-paper"
    >
      <div className="grid grid-cols-7 border-b border-line bg-sunk">
        {WEEKDAY_SHORT.map((label, slot) => (
          <div
            key={label}
            className={`px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.1em] ${
              slot > 4 ? "text-accent-ink" : "text-muted"
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayEvents = index.get(cell.key) ?? [];
          const isToday = cell.key === today;
          const isSelected = cell.key === selected;
          const weekend = cell.weekday > 4;
          const shown = dayEvents.slice(0, 3);
          const rest = dayEvents.length - shown.length;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelect(cell.key)}
              aria-current={isToday ? "date" : undefined}
              className={`group relative flex min-h-[70px] flex-col gap-1 border-b border-r border-line p-1.5 text-left transition-colors last:border-r-0 sm:min-h-[112px] sm:p-2 ${
                cell.inMonth
                  ? weekend
                    ? "bg-sunk/40 hover:bg-accent-soft/40"
                    : "bg-surface hover:bg-sunk/60"
                  : "bg-paper-edge/50 text-muted hover:bg-paper-edge"
              } ${isSelected ? "ring-2 ring-inset ring-ink" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span
                  className={`tabular inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-display text-[13px] font-semibold sm:text-sm ${
                    isToday
                      ? "bg-accent text-surface"
                      : cell.inMonth
                        ? "text-ink"
                        : "text-muted"
                  }`}
                >
                  {cell.day}
                </span>
                {dayEvents.length > 0 ? (
                  <span className="tabular hidden text-[10px] font-medium text-muted sm:inline">
                    {dayEvents.length}
                  </span>
                ) : null}
              </span>

              <span className="hidden flex-1 flex-col gap-1 sm:flex">
                {shown.map((event) => (
                  <span
                    key={event.id}
                    className="flex items-center gap-1 overflow-hidden rounded-sm px-1 py-0.5 text-[11px] leading-tight"
                    style={{
                      backgroundColor: `${tagOf(event.tag).color}12`,
                      color: event.done
                        ? "var(--color-muted)"
                        : "var(--color-ink)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="h-3 w-[2px] shrink-0 rounded-full"
                      style={{ backgroundColor: tagOf(event.tag).color }}
                    />
                    {event.time ? (
                      <span className="tabular shrink-0 font-medium text-muted">
                        {event.time}
                      </span>
                    ) : null}
                    <span
                      className={`truncate ${event.done ? "line-through" : ""}`}
                    >
                      {event.title}
                    </span>
                  </span>
                ))}
                {rest > 0 ? (
                  <span className="px-1 text-[11px] font-medium text-muted">
                    {rest} kayıt daha
                  </span>
                ) : null}
              </span>

              <span className="flex flex-wrap items-center gap-0.5 sm:hidden">
                {dayEvents.slice(0, 4).map((event) => (
                  <span
                    key={event.id}
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
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
