"use client";

import { MONTH_NAMES, formatShort, makeKey, relativeLabel } from "@/lib/dates";
import { indexRange, upcoming } from "@/lib/occurrences";
import { TAGS, tagOf, type AlmanakEvent } from "@/lib/types";
import { TagDot } from "./ui";

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

  const tagRows = TAGS.map((tag) => ({
    tag,
    count: perTag.get(tag.id) ?? 0,
  }))
    .filter((row) => row.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const maxTag = tagRows[0]?.count ?? 1;
  const nextDays = upcoming(events, today, 120).slice(0, 4);

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <article className="rounded-lg border border-line bg-surface p-3 shadow-paper">
        <h2 className="font-display text-[15px] font-semibold">{year} özeti</h2>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="tabular font-display text-3xl font-bold text-accent-ink">
            {total}
          </span>
          <span className="text-[13px] text-muted">kayıt, tekrarlar dahil</span>
        </p>
        {busiest.count > 0 ? (
          <p className="mt-1 text-[13px] text-ink-soft">
            En yoğun ay {MONTH_NAMES[busiest.month]}, {busiest.count} kayıt.
          </p>
        ) : (
          <p className="mt-1 text-[13px] text-muted">Bu yıl henüz boş.</p>
        )}
      </article>

      <article className="rounded-lg border border-line bg-surface p-3 shadow-paper">
        <h2 className="mb-2 font-display text-[15px] font-semibold">
          Etiket dağılımı
        </h2>
        {tagRows.length === 0 ? (
          <p className="text-[13px] text-muted">Gösterilecek etiket yok.</p>
        ) : (
          <ul className="space-y-1.5">
            {tagRows.map((row) => (
              <li key={row.tag.id} className="flex items-center gap-2">
                <TagDot tag={row.tag.id} size={6} />
                <span className="w-20 shrink-0 text-[12px] text-ink-soft">
                  {row.tag.label}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunk">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round((row.count / maxTag) * 100)}%`,
                      backgroundColor: tagOf(row.tag.id).color,
                    }}
                  />
                </span>
                <span className="tabular w-6 text-right text-[12px] text-muted">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-lg border border-line bg-surface p-3 shadow-paper">
        <h2 className="mb-2 font-display text-[15px] font-semibold">Sıradaki</h2>
        {nextDays.length === 0 ? (
          <p className="text-[13px] text-muted">Yaklaşan kayıt yok.</p>
        ) : (
          <ul className="space-y-1">
            {nextDays.map((day) => (
              <li key={day.key}>
                <button
                  type="button"
                  onClick={() => onSelect(day.key)}
                  className="flex w-full items-baseline gap-2 rounded-md px-1.5 py-1 text-left hover:bg-sunk"
                >
                  <span className="tabular w-12 shrink-0 text-[11px] font-semibold text-accent-ink">
                    {formatShort(day.key)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {day.events[0].title}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {relativeLabel(day.key, today)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
