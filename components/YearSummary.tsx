"use client";

import { MONTH_NAMES, formatShort, makeKey, relativeLabel } from "@/lib/dates";
import { indexRange, upcoming } from "@/lib/occurrences";
import { TAGS, tagOf, type AlmanakEvent } from "@/lib/types";
import { Card } from "./ui";

type Props = {
  year: number;
  events: AlmanakEvent[];
  today: string;
  onSelect: (key: string) => void;
};

export function YearSummary({ year, events, today, onSelect }: Props) {
  const index = indexRange(events, makeKey(year, 0, 1), makeKey(year, 11, 31));

  let total = 0;
  const perMonth = new Array(12).fill(0);
  const perTag = new Map<string, number>();

  for (const [key, dayEvents] of index) {
    const month = Number(key.slice(5, 7)) - 1;
    perMonth[month] += dayEvents.length;
    total += dayEvents.length;
    for (const event of dayEvents) {
      perTag.set(event.tag, (perTag.get(event.tag) ?? 0) + 1);
    }
  }

  const busiest = perMonth.reduce(
    (best, count, month) => (count > best.count ? { month, count } : best),
    { month: -1, count: 0 },
  );

  const tagRows = TAGS.map((tag) => ({ tag, count: perTag.get(tag.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);

  const maxTag = tagRows[0]?.count ?? 1;
  const nextDays = upcoming(events, today, 120).slice(0, 5);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card title={`${year} özeti`} accent="bg-yellow">
        <div className="px-4 py-4">
          <p className="flex items-baseline gap-2">
            <span className="tabular text-4xl font-bold leading-none">
              {total}
            </span>
            <span className="text-sm font-bold text-muted">
              kayıt, tekrarlar dahil
            </span>
          </p>
          {busiest.count > 0 ? (
            <p className="mt-2 text-sm font-medium text-ink-soft">
              En yoğun ay {MONTH_NAMES[busiest.month]}, {busiest.count} kayıt.
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-muted">
              Bu yıl henüz boş.
            </p>
          )}
        </div>
      </Card>

      <Card title="Etiket dağılımı" accent="bg-blue">
        <div className="px-4 py-4">
          {tagRows.length === 0 ? (
            <p className="text-sm font-medium text-muted">
              Gösterilecek etiket yok.
            </p>
          ) : (
            <ul className="space-y-2">
              {tagRows.map((row) => (
                <li key={row.tag.id} className="flex items-center gap-2.5">
                  <span className="w-20 shrink-0 text-xs font-bold">
                    {row.tag.label}
                  </span>
                  <span className="nb-thin h-4 flex-1 overflow-hidden rounded-sm bg-cream">
                    <span
                      className="block h-full"
                      style={{
                        width: `${Math.max(8, Math.round((row.count / maxTag) * 100))}%`,
                        backgroundColor: tagOf(row.tag.id).color,
                      }}
                    />
                  </span>
                  <span className="tabular w-6 shrink-0 text-right text-xs font-bold">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card title="Sıradaki" accent="bg-grass">
        <div className="px-2 py-2">
          {nextDays.length === 0 ? (
            <p className="px-2 py-3 text-sm font-medium text-muted">
              Yaklaşan kayıt yok.
            </p>
          ) : (
            <ul>
              {nextDays.map((day) => (
                <li key={day.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(day.key)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left hover:bg-peach-soft"
                  >
                    <span className="tabular w-14 shrink-0 text-xs font-bold text-rust">
                      {formatShort(day.key)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {day.events[0].title}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-muted">
                      {relativeLabel(day.key, today)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </section>
  );
}
