"use client";

import type { ReactNode } from "react";
import { Logo } from "./Logo";

export type ViewId = "panel" | "ay" | "yil";

type Props = {
  view: ViewId;
  onSelect: (view: ViewId) => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
};

const ITEMS: {
  id: ViewId;
  label: string;
  icon: ReactNode;
  accent: string;
}[] = [
  {
    id: "panel",
    label: "Ana Sayfa",
    accent: "bg-gold",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M3.5 11 12 4l8.5 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 10.5V20h13v-9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M10 20v-5h4v5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "ay",
    label: "Ajanda",
    accent: "bg-sky",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect
          x="3.5"
          y="5"
          width="17"
          height="15"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path d="M3.5 10h17" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="7" y="13" width="3.5" height="3.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "yil",
    label: "Almanak",
    accent: "bg-lilac",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" fill="currentColor" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" fill="currentColor" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" fill="currentColor" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

function RailButton({
  label,
  active,
  accent,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  accent: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`press-sm group relative flex h-10 w-10 items-center justify-center rounded-md nb ${
        active ? `${accent} shadow-nb-sm` : "bg-card hover:bg-tint"
      }`}
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-sm nb bg-ink px-2.5 py-1 text-xs font-bold text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        {label}
      </span>
    </button>
  );
}

export function Sidebar({ view, onSelect, onOpenSettings, settingsOpen }: Props) {
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col items-center gap-3 border-r-2 border-ink bg-shell py-4">
      <button
        type="button"
        onClick={() => onSelect("panel")}
        aria-label="Doffice, ana sayfaya git"
        className="press-sm group relative mb-2 h-12 w-12 rounded-[11px]"
      >
        <Logo className="h-12 w-12" />
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-sm nb bg-ink px-2.5 py-1 text-xs font-bold text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          Doffice
        </span>
      </button>

      <nav className="flex flex-col gap-2.5">
        {ITEMS.map((item) => (
          <RailButton
            key={item.id}
            label={item.label}
            active={item.id === view}
            accent={item.accent}
            onClick={() => onSelect(item.id)}
          >
            {item.icon}
          </RailButton>
        ))}
      </nav>

      <div className="mt-auto">
        <RailButton
          label="Ayarlar"
          active={settingsOpen}
          accent="bg-mint"
          onClick={onOpenSettings}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <circle
              cx="12"
              cy="12"
              r="3.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <path
              d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </RailButton>
      </div>
    </aside>
  );
}
