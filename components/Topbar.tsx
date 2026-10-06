"use client";

import type { RefObject } from "react";
import { MONTH_NAMES, formatLong, formatShort } from "@/lib/dates";
import type { AlmanakEvent } from "@/lib/types";
import type { ViewId } from "./Sidebar";
import { Button, SquareButton, TagDot } from "./ui";

type Props = {
  view: ViewId;
  year: number;
  month: number;
  today: string;
  query: string;
  results: AlmanakEvent[];
  searchRef: RefObject<HTMLInputElement | null>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onQueryChange: (value: string) => void;
  onPickResult: (key: string) => void;
  onNew: () => void;
  onOpenMenu: () => void;
};

const TITLES: Record<ViewId, string> = {
  panel: "Panel",
  ay: "Takvim",
  yil: "Yıl görünümü",
  liste: "Kayıtlar",
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
  onOpenMenu,
}: Props) {
  const showPeriod = view === "ay" || view === "yil";
  const heading =
    view === "ay"
      ? `${MONTH_NAMES[month]} ${year}`
      : view === "yil"
        ? String(year)
        : view === "liste"
          ? "Defterin tamamı"
          : formatLong(today);

  return (
    <header className="no-print mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Menüyü aç"
          className="nb press-sm mt-1 rounded-md bg-card px-3 py-2 text-sm font-bold shadow-nb-sm lg:hidden"
        >
          ☰
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/80">
            {TITLES[view]}
          </p>
          <h1 className="mt-1 text-3xl font-bold leading-none tracking-[-0.04em] sm:text-4xl">
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
            placeholder="Kayıtlarda ara"
            aria-label="Kayıtlarda ara"
            className="nb h-11 w-full rounded-md bg-card px-3.5 text-sm font-medium shadow-nb-sm placeholder:text-muted focus:outline-none"
          />
          {query.trim().length > 1 ? (
            <div className="anim-rise scroll-thin nb absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg bg-card p-1.5 shadow-nb">
              {results.length === 0 ? (
                <p className="px-2 py-3 text-center text-sm font-medium text-muted">
                  Eşleşen kayıt yok.
                </p>
              ) : (
                results.slice(0, 40).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onPickResult(event.date)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left hover:bg-peach-soft"
                  >
                    <TagDot tag={event.tag} size={10} />
                    <span className="tabular w-16 shrink-0 text-xs font-bold text-muted">
                      {formatShort(event.date)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {event.title}
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
