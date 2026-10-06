"use client";

import { MONTH_NAMES, WEEKDAY_SHORT, monthCells } from "@/lib/dates";
import type { DofficeEvent } from "@/lib/types";

type Props = {
  year: number;
  index: Map<string, DofficeEvent[]>;
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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {MONTH_NAMES.map((name, month) => {
        const cardDelay = month * 28;
        const cells = monthCells(year, month);
        const monthCount = cells.reduce((total, cell) => {
          if (!cell.inMonth) return total;
          return total + (index.get(cell.key)?.length ?? 0);
        }, 0);

        return (
          <article
            key={name}
            style={{ animationDelay: `${cardDelay}ms` }}
            className="lift anim-rise nb overflow-hidden rounded-lg bg-card shadow-nb"
          >
            <header
              className="flex items-center justify-between border-b-2 border-ink bg-gold px-3 py-2"
            >
              <button
                type="button"
                onClick={() => onOpenMonth(month)}
                className="chip-pop rounded-sm px-1 text-sm font-bold tracking-tight underline-offset-4 hover:underline"
              >
                {name}
              </button>
              {monthCount > 0 ? (
                <span className="nb-thin tabular rounded-sm bg-card px-1.5 py-0.5 text-[10px] font-bold text-ink">
                  {monthCount}
                </span>
              ) : null}
            </header>

            <div className="grid grid-cols-7 justify-items-center gap-y-0.5 px-2 py-2.5">
              {WEEKDAY_SHORT.map((label, slot) => (
                <div
                  key={`${name}-${label}`}
                  className={`pb-1 text-center text-[10px] font-bold ${
                    slot > 4 ? "text-rust" : "text-muted"
                  }`}
                >
                  {label.slice(0, 1)}
                </div>
              ))}

              {cells.map((cell) => {
                const dayEvents = index.get(cell.key) ?? [];
                const isToday = cell.key === today;
                const isSelected = cell.key === selected;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => onSelectDay(cell.key)}
                    aria-label={`${cell.day} ${MONTH_NAMES[cell.month]}${
                      dayEvents.length > 0 ? `, ${dayEvents.length} kayıt` : ""
                    }`}
                    aria-current={isToday ? "date" : undefined}
                    className={`chip-pop tabular relative flex h-[28px] w-[28px] items-center justify-center rounded-md text-[12px] font-bold ${
                      isToday
                        ? "nb-thin bg-gold shadow-nb-xs"
                        : cell.inMonth
                          ? dayEvents.length > 0
                            ? "nb-thin bg-cream hover:bg-tint"
                            : "hover:bg-cream"
                          : "text-muted/60 hover:bg-cream"
                    } ${isSelected && !isToday ? "ring-2 ring-ink" : ""}`}
                  >
                    {cell.day}
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
