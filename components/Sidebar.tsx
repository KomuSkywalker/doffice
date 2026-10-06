"use client";

import type { ReactNode } from "react";

export type ViewId = "panel" | "ay" | "yil" | "liste";

type Props = {
  view: ViewId;
  counts: { bugun: number; geciken: number; toplam: number };
  locked: boolean;
  open: boolean;
  onSelect: (view: ViewId) => void;
  onClose: () => void;
  onUnlock: () => void;
  onImport: (text: string) => void;
  onPickFile: () => void;
};

const ITEMS: {
  id: ViewId;
  label: string;
  hint: string;
  icon: ReactNode;
  accent: string;
}[] = [
  {
    id: "panel",
    label: "Panel",
    hint: "Bugün ve özet",
    accent: "bg-yellow",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="13" y="3" width="8" height="5" rx="2" fill="currentColor" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
        <rect x="13" y="10" width="8" height="11" rx="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "ay",
    label: "Takvim",
    hint: "Ay görünümü",
    accent: "bg-blue",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="2.4" />
        <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "yil",
    label: "Yıl",
    hint: "On iki ay",
    accent: "bg-orange",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="3" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "liste",
    label: "Kayıtlar",
    hint: "Tüm defter",
    accent: "bg-grass",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M4 6h16M4 12h16M4 18h10"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Sidebar({
  view,
  counts,
  locked,
  open,
  onSelect,
  onClose,
  onUnlock,
  onPickFile,
}: Props) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={onClose}
          className="anim-fade fixed inset-0 z-40 bg-ink/30 lg:hidden"
        />
      ) : null}

      <aside
        className={`scroll-thin fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col gap-5 overflow-y-auto border-r-[3px] border-ink bg-peach-deep px-4 py-5 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } no-print`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2.5">
            <span className="nb flex h-10 w-10 items-center justify-center rounded-md bg-ink text-lg font-bold text-yellow shadow-nb-xs">
              A
            </span>
            <span className="text-xl font-bold tracking-[-0.04em]">ALMANAK</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="nb-thin rounded-md bg-card px-2 py-1 text-sm font-bold lg:hidden"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {ITEMS.map((item) => {
            const active = item.id === view;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "page" : undefined}
                className={`nb press-sm flex items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold ${
                  active
                    ? `${item.accent} shadow-nb-sm`
                    : "bg-card/70 shadow-none hover:bg-card"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-tight">{item.label}</span>
                  <span className="block text-[11px] font-medium text-ink/80">
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="nb rounded-lg bg-card px-3 py-3 shadow-nb-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Bugünün durumu
          </p>
          <dl className="mt-2 space-y-1.5 text-sm font-bold">
            <div className="flex items-center justify-between">
              <dt>Bugün</dt>
              <dd className="tabular">{counts.bugun}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className={counts.geciken > 0 ? "text-rust" : undefined}>
                Geciken
              </dt>
              <dd className="tabular">{counts.geciken}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Toplam kayıt</dt>
              <dd className="tabular">{counts.toplam}</dd>
            </div>
          </dl>
        </div>

        <div aria-hidden className="relative my-2 hidden min-h-[120px] flex-1 lg:block">
          <div className="hatch absolute left-2 top-4 h-24 w-36 -rotate-3 rounded-sm opacity-70" />
          <svg viewBox="0 0 100 100" className="absolute right-3 top-16 h-14 w-14">
            <path
              d="M50 0 L58 38 L96 46 L58 54 L50 96 L42 54 L4 46 L42 38 Z"
              fill="#5b93f7"
              stroke="#141210"
              strokeWidth="4"
            />
          </svg>
        </div>

        <div className="mt-auto space-y-2">
          {locked ? (
            <button
              type="button"
              onClick={onUnlock}
              className="nb press-sm flex w-full items-center justify-center gap-2 rounded-md bg-orange px-3 py-2 text-sm font-bold text-ink shadow-nb-sm"
            >
              Kilitli, anahtar gir
            </button>
          ) : null}
          <a
            href="/api/backup"
            className="nb press-sm flex w-full items-center justify-center rounded-md bg-card px-3 py-2 text-sm font-bold shadow-nb-sm"
          >
            Yedek al
          </a>
          <button
            type="button"
            onClick={onPickFile}
            className="nb press-sm flex w-full items-center justify-center rounded-md bg-card px-3 py-2 text-sm font-bold shadow-nb-sm"
          >
            Yedek yükle
          </button>
          <p className="pt-1 text-[11px] font-medium leading-snug text-ink/80">
            Veriler bu bilgisayardaki JSON dosyasında durur.
          </p>
        </div>
      </aside>
    </>
  );
}
