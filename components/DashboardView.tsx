"use client";

import { useState } from "react";
import { formatLong } from "@/lib/dates";
import { dayItems, itemSpan } from "@/lib/routines";
import {
  DEFAULT_COLOR,
  projectProgress,
  siteName,
  type DofficeEvent,
  type Project,
  type Routine,
  type Shortcut,
  type ShortcutDraft,
} from "@/lib/types";
import { Button, Card, Chip, ColorRow, Dot, inputClass } from "./ui";

type Props = {
  events: DofficeEvent[];
  routines: Routine[];
  projects: Project[];
  shortcuts: Shortcut[];
  today: string;
  pending: boolean;
  onSelect: (key: string) => void;
  onToggleDone: (event: DofficeEvent) => void;
  onOpenProjects: () => void;
  onCreateShortcut: (draft: ShortcutDraft) => Promise<boolean>;
  onDeleteShortcut: (id: string) => Promise<boolean>;
};

export function DashboardView({
  events,
  routines,
  projects,
  shortcuts,
  today,
  pending,
  onSelect,
  onToggleDone,
  onOpenProjects,
  onCreateShortcut,
  onDeleteShortcut,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  const todayEvents = dayItems(events, routines, today);

  const agenda = projects
    .filter((project) => project.status !== "bitti")
    .sort((left, right) => (left.updatedAt > right.updatedAt ? -1 : 1));

  const addShortcut = async () => {
    if (url.trim().length === 0) {
      setError("Adres gerekli.");
      return;
    }
    const ok = await onCreateShortcut({
      label: label.trim(),
      url: url.trim(),
      color,
    });
    if (ok) {
      setLabel("");
      setUrl("");
      setError(null);
      setAdding(false);
    } else {
      setError("Eklenemedi, adresi kontrol et.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title="Bugünün programı"
          accent="bg-gold"
          className="min-w-0"
          action={
            <button
              type="button"
              onClick={() => onSelect(today)}
              className="chip-pop nb-thin rounded-sm bg-card px-2 py-1 text-[11px] font-bold text-ink"
            >
              Güne git
            </button>
          }
        >
          <div className="px-4 py-4">
            <p className="mb-3 text-sm font-bold text-muted">{formatLong(today)}</p>
            {todayEvents.length === 0 ? (
              <p className="nb-thin rounded-md border-dashed bg-tint/60 px-4 py-8 text-center text-sm font-bold">
                Bugün temiz.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {todayEvents.map((event, position) => (
                  <li
                    key={event.id}
                    style={{ animationDelay: `${position * 45}ms` }}
                    className="anim-rise nb-thin flex items-start gap-3 rounded-md bg-cream px-3 py-2.5"
                  >
                    {event.repeat === "yok" && !event.routineId ? (
                      <input
                        type="checkbox"
                        checked={event.done}
                        onChange={() => onToggleDone(event)}
                        aria-label={`${event.title} tamamlandı`}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
                      />
                    ) : (
                      <span className="mt-1 w-4 shrink-0">
                        <Dot color={event.color} size={10} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        {event.time ? (
                          <span className="tabular text-sm font-bold text-rust">
                            {event.routineId ? itemSpan(event) : event.time}
                          </span>
                        ) : null}
                        <span
                          className={`text-sm font-bold transition-all duration-200 ${
                            event.done ? "text-muted line-through opacity-70" : ""
                          }`}
                        >
                          {event.title}
                        </span>
                        {event.routineId ? (
                          <span className="nb-thin rounded-sm bg-card px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            rutin
                          </span>
                        ) : null}
                      </span>
                      {event.note ? (
                        <span className="mt-0.5 block text-[13px] font-medium text-ink-soft">
                          {event.note}
                        </span>
                      ) : null}
                    </span>
                    <Chip label={event.label} color={event.color} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card
            title="Gündem"
            accent="bg-lilac"
            action={
              <button
                type="button"
                onClick={onOpenProjects}
                className="chip-pop nb-thin rounded-sm bg-card px-2 py-1 text-[11px] font-bold text-ink"
              >
                Projeler
              </button>
            }
          >
            <div className="px-4 py-4">
              {agenda.length === 0 ? (
                <p className="nb-thin rounded-md border-dashed bg-tint/60 px-3 py-6 text-center text-sm font-bold">
                  Açık proje yok.
                </p>
              ) : (
                <ul className="space-y-2">
                  {agenda.slice(0, 8).map((project, position) => {
                    const progress = projectProgress(project);
                    return (
                      <li
                        key={project.id}
                        style={{ animationDelay: `${position * 40}ms` }}
                        className="anim-rise"
                      >
                        <button
                          type="button"
                          onClick={onOpenProjects}
                          className="row-slide nb-thin block w-full rounded-md bg-cream px-3 py-2 text-left"
                        >
                          <span className="flex items-center gap-2.5">
                            <Dot color={project.color} size={10} />
                            <span className="min-w-0 flex-1 truncate text-sm font-bold">
                              {project.name}
                            </span>
                            {project.status === "beklemede" ? (
                              <span className="nb-thin shrink-0 rounded-sm bg-apricot px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                bekliyor
                              </span>
                            ) : null}
                            {progress.total > 0 ? (
                              <span className="tabular shrink-0 text-[11px] font-bold text-muted">
                                {progress.done}/{progress.total}
                              </span>
                            ) : null}
                          </span>

                          {progress.total > 0 ? (
                            <span className="mt-1.5 block">
                              <span className="nb-thin block h-2 overflow-hidden rounded-sm bg-card">
                                <span
                                  className="block h-full transition-[width] duration-500 ease-out"
                                  style={{
                                    width: `${Math.max(progress.percent, 2)}%`,
                                    backgroundColor: project.color,
                                  }}
                                />
                              </span>
                              <span className="mt-1 block truncate text-[11px] font-medium text-muted">
                                {progress.current
                                  ? `Sırada: ${progress.current}`
                                  : "Bütün aşamalar bitti"}
                              </span>
                            </span>
                          ) : project.note ? (
                            <span className="mt-0.5 block truncate text-[11px] font-medium text-muted">
                              {project.note}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card
            title="Hızlı erişim"
            accent="bg-sky"
            action={
              <button
                type="button"
                onClick={() => {
                  setAdding((current) => !current);
                  setError(null);
                }}
                className="chip-pop nb-thin rounded-sm bg-card px-2 py-1 text-[11px] font-bold text-ink"
              >
                {adding ? "Vazgeç" : "Ekle"}
              </button>
            }
          >
            <div className="space-y-3 px-4 py-4">
              {adding ? (
                <div className="nb-thin space-y-2 rounded-md bg-cream px-3 py-3">
                  <input
                    className={inputClass}
                    value={label}
                    maxLength={80}
                    placeholder="Ad, boş olabilir"
                    onChange={(event) => setLabel(event.target.value)}
                  />
                  <input
                    className={inputClass}
                    value={url}
                    maxLength={500}
                    placeholder="site.com"
                    onChange={(event) => setUrl(event.target.value)}
                  />
                  <ColorRow color={color} onColor={setColor} size="h-6 w-6" />
                  {error ? (
                    <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
                      {error}
                    </p>
                  ) : null}
                  <Button
                    tone="primary"
                    disabled={pending}
                    onClick={() => void addShortcut()}
                  >
                    Kısayolu ekle
                  </Button>
                </div>
              ) : null}

              {shortcuts.length === 0 ? (
                <p className="nb-thin rounded-md border-dashed bg-tint/60 px-3 py-6 text-center text-sm font-bold">
                  Kısayol yok.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {shortcuts.map((shortcut, position) => (
                    <li
                      key={shortcut.id}
                      style={{ animationDelay: `${position * 25}ms` }}
                      className="anim-rise flex items-stretch"
                    >
                      <a
                        href={shortcut.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={siteName(shortcut.url)}
                        className="press-sm nb-thin flex items-center gap-2 rounded-l-sm bg-card py-1.5 pl-2 pr-2.5"
                      >
                        <span
                          aria-hidden
                          className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-ink"
                          style={{ backgroundColor: shortcut.color }}
                        />
                        <span className="max-w-[150px] truncate text-sm font-bold">
                          {shortcut.label}
                        </span>
                      </a>
                      <button
                        type="button"
                        disabled={pending}
                        aria-label={`${shortcut.label} kısayolunu sil`}
                        onClick={() => void onDeleteShortcut(shortcut.id)}
                        className="nb-thin -ml-[2px] rounded-r-sm bg-card px-1.5 text-xs font-bold text-muted hover:bg-coral hover:text-ink"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
