"use client";

import { useRef, type RefObject } from "react";
import { MONTH_NAMES, formatShort } from "@/lib/dates";
import type { AlmanakEvent } from "@/lib/types";
import { Button, TagDot } from "./ui";

export type ViewMode = "ay" | "yil";

type Props = {
  view: ViewMode;
  year: number;
  month: number;
  query: string;
  results: AlmanakEvent[];
  locked: boolean;
  total: number;
  searchRef: RefObject<HTMLInputElement | null>;
  onViewChange: (view: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onQueryChange: (value: string) => void;
  onPickResult: (key: string) => void;
  onUnlock: () => void;
  onImport: (text: string) => void;
};

export function TopBar({
  view,
  year,
  month,
  query,
  results,
  locked,
  total,
  searchRef,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onQueryChange,
  onPickResult,
  onUnlock,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const period = view === "ay" ? `${MONTH_NAMES[month]} ${year}` : String(year);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur no-print">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tracking-[0.18em] text-ink">
              ALMANAK
            </span>
            <span className="hidden text-[11px] text-muted sm:inline">
              {total} kayıt
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => onViewChange("ay")}
              aria-pressed={view === "ay"}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "ay" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              Ay
            </button>
            <button
              type="button"
              onClick={() => onViewChange("yil")}
              aria-pressed={view === "yil"}
              className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "yil" ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              Yıl
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            tone="ghost"
            onClick={onPrev}
            aria-label="Önceki"
            className="px-2.5"
          >
            ‹
          </Button>
          <h1 className="tabular min-w-[140px] text-center font-display text-lg font-semibold sm:min-w-[180px] sm:text-xl">
            {period}
          </h1>
          <Button
            tone="ghost"
            onClick={onNext}
            aria-label="Sonraki"
            className="px-2.5"
          >
            ›
          </Button>
          <Button tone="quiet" onClick={onToday} className="text-xs">
            Bugün
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-72">
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Kayıtlarda ara"
              aria-label="Kayıtlarda ara"
              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {query.trim().length > 1 ? (
              <div className="anim-rise scroll-thin absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-raised">
                {results.length === 0 ? (
                  <p className="px-2 py-3 text-center text-[13px] text-muted">
                    Eşleşen kayıt yok.
                  </p>
                ) : (
                  results.slice(0, 40).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onPickResult(event.date)}
                      className="flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sunk"
                    >
                      <TagDot tag={event.tag} size={6} />
                      <span className="tabular w-16 shrink-0 text-[11px] font-medium text-muted">
                        {formatShort(event.date)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">
                        {event.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {locked ? (
            <Button tone="ghost" onClick={onUnlock} className="text-xs">
              Kilitli
            </Button>
          ) : null}

          <span className="hidden items-center gap-2 sm:flex">
            <a
              href="/api/backup"
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              Yedek al
            </a>
            <Button
              tone="ghost"
              className="text-xs"
              onClick={() => fileRef.current?.click()}
            >
              Yedek yükle
            </Button>
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              onImport(text);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
