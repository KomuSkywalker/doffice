"use client";

import type { RefObject } from "react";
import { MONTH_NAMES, formatLong, formatShort } from "@/lib/dates";
import { KIND_LABELS, type SearchHit } from "@/lib/search";
import type { ViewId } from "./Sidebar";
import { Button, Dot, SquareButton } from "./ui";

type Props = {
  view: ViewId;
  year: number;
  month: number;
  today: string;
  query: string;
  results: SearchHit[];
  searchRef: RefObject<HTMLInputElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onQueryChange: (value: string) => void;
  onPickResult: (hit: SearchHit) => void;
  onNew: () => void;
};

const TITLES: Record<ViewId, string> = {
  panel: "Ana Sayfa",
  ay: "Ajanda",
  yil: "Almanak",
  proje: "Projeler",
  bildirim: "Bildirimler",
};

export function Topbar({
  view,
  year,
  month,
  today,
  query,
  results,
  searchRef,
  onPrev,
  onNext,
  onToday,
  onQueryChange,
  onPickResult,
  onNew,
}: Props) {
  const showPeriod = view === "ay" || view === "yil";
  const heading =
    view === "ay"
      ? `${MONTH_NAMES[month]} ${year}`
      : view === "yil"
        ? String(year)
        : view === "bildirim"
          ? "Randevu talepleri"
          : view === "proje"
            ? "Dosyalar ve projeler"
            : formatLong(today);

  return (
    <header className="no-print mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex items-start gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/80">
            {TITLES[view]}
          </p>
          <h1
            key={heading}
            className="anim-rise mt-1 text-3xl font-bold leading-none tracking-[-0.04em] sm:text-4xl"
          >
            {heading}
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {showPeriod ? (
          <span className="flex items-center gap-2">
            <SquareButton label="Önceki" onClick={onPrev}>
              ‹
            </SquareButton>
            <SquareButton label="Sonraki" onClick={onNext}>
              ›
            </SquareButton>
            <Button tone="plain" onClick={onToday} className="h-11">
              Bugün
            </Button>
          </span>
        ) : null}

        <div className="relative min-w-[200px] flex-1 sm:min-w-[260px]">
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Her şeyde ara"
            aria-label="Her şeyde ara"
            className="nb h-11 w-full rounded-md bg-card px-3.5 text-sm font-medium shadow-nb-sm placeholder:text-muted focus:outline-none"
          />
          {query.trim().length > 1 ? (
            <div className="anim-rise scroll-thin nb absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg bg-card p-1.5 shadow-nb">
              {results.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm font-medium text-muted">
                  Eşleşen bir şey yok.
                </p>
              ) : (
                results.slice(0, 40).map((hit, position) => (
                  <button
                    key={`${hit.kind}-${hit.id}`}
                    style={{ animationDelay: `${Math.min(position, 10) * 20}ms` }}
                    type="button"
                    onClick={() => onPickResult(hit)}
                    className="anim-rise row-slide flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left hover:bg-tint"
                  >
                    <Dot color={hit.color} size={10} />
                    <span className="nb-thin w-16 shrink-0 rounded-sm bg-cream px-1 py-0.5 text-center text-[10px] font-bold uppercase">
                      {KIND_LABELS[hit.kind]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {hit.title}
                    </span>
                    <span className="tabular shrink-0 text-[11px] font-bold text-muted">
                      {hit.date ? formatShort(hit.date) : hit.sub}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <Button tone="primary" onClick={onNew} className="h-11">
          Yeni kayıt
        </Button>
      </div>
    </header>
  );
}
