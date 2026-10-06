"use client";

import { MONTH_NAMES, WEEKDAY_SHORT, monthCells } from "@/lib/dates";
import type { AlmanakEvent } from "@/lib/types";
import { tagOf } from "@/lib/types";

type Props = {
  year: number;
  index: Map<string, AlmanakEvent[]>;
  today: string;
  selected: string | null;
  onSelectDay: (key: string) => void;
  onOpenMonth: (month: number) => void;
};

export function YearView({
  year,
  index,
  today,
  selected,
  onSelectDay,
  onOpenMonth,
}: Props) {
  return (
    <section
      aria-label={`${year} yılı`}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    >
      {MONTH_NAMES.map((name, month) => {
        const cells = monthCells(year, month);
        const monthCount = cells.reduce((total, cell) => {
          if (!cell.inMonth) return total;
          return total + (index.get(cell.key)?.length ?? 0);
        }, 0);

        return (
          <article
            key={name}
            className="rounded-lg border border-line bg-surface px-2 py-2.5 shadow-paper"
          >
            <header className="mb-1 flex items-baseline justify-between gap-1 px-0.5">
              <button
                type="button"
                onClick={() => onOpenMonth(month)}
                className="font-display text-[13px] font-semibold text-ink hover:text-accent-ink"
              >
                {name}
              </button>
              {monthCount > 0 ? (
                <span className="tabular text-[10px] text-muted">
                  {monthCount}
                </span>
              ) : null}
            </header>

            <div className="grid grid-cols-7 justify-items-center gap-y-[1px]">
              {WEEKDAY_SHORT.map((label, slot) => (
                <div
                  key={`${name}-${label}`}
                  className={`pb-0.5 text-center text-[9px] font-semibold ${
                    slot > 4 ? "text-accent-ink" : "text-muted"
                  }`}
                >
                  {label.slice(0, 1)}
                </div>
              ))}

              {cells.map((cell) => {
                const dayEvents = index.get(cell.key) ?? [];
                const isToday = cell.key === today;
                const isSelected = cell.key === selected;
                const marker = dayEvents[0];

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onSelectDay(cell.key)}
                    aria-label={`${cell.day} ${MONTH_NAMES[cell.month]}${
                      dayEvents.length > 0 ? `, ${dayEvents.length} kayıt` : ""
                    }`}
                    aria-current={isToday ? "date" : undefined}
                    className={`tabular relative flex h-[26px] w-[26px] items-center justify-center rounded-[5px] text-[11px] font-medium transition-colors ${
                      isToday
                        ? "bg-accent font-semibold text-surface"
                        : cell.inMonth
                          ? dayEvents.length > 0
                            ? "bg-accent-soft text-ink hover:bg-accent-soft/70"
                            : "text-ink-soft hover:bg-sunk"
                          : "text-muted hover:bg-sunk/50"
                    } ${isSelected && !isToday ? "ring-1 ring-ink" : ""}`}
                  >
                    {cell.day}
                    {marker && !isToday ? (
                      <span
                        aria-hidden
                        className="absolute bottom-[1px] h-[3px] w-[3px] rounded-full"
                        style={{ backgroundColor: tagOf(marker.tag).color }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
