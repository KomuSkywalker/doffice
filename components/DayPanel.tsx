"use client";

import { useEffect, useRef, useState } from "react";
import { formatLong, relativeLabel } from "@/lib/dates";
import { repeatLabel, type AlmanakEvent, type EventDraft } from "@/lib/types";
import { EventForm } from "./EventForm";
import { Button, TagChip } from "./ui";

type Props = {
  dateKey: string;
  today: string;
  events: AlmanakEvent[];
  pending: boolean;
  onClose: () => void;
  onCreate: (draft: EventDraft) => Promise<boolean>;
  onUpdate: (id: string, draft: EventDraft) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onToggleDone: (event: AlmanakEvent) => void;
};

export function DayPanel({
  dateKey,
  today,
  events,
  pending,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onToggleDone,
}: Props) {
  const [editing, setEditing] = useState<AlmanakEvent | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const relative = relativeLabel(dateKey, today);

  return (
    <div className="fixed inset-0 z-40 flex justify-end no-print">
      <button
        type="button"
        aria-label="Paneli kapat"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-ink/25 backdrop-blur-[1px]"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${formatLong(dateKey)} kayıtları`}
        className="anim-panel scroll-thin relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-paper shadow-panel"
      >
        <header className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {relative}
              </p>
              <h2 className="font-display text-xl font-semibold leading-tight">
                {formatLong(dateKey)}
              </h2>
            </div>
            <Button
              tone="quiet"
              onClick={onClose}
              aria-label="Kapat"
              className="shrink-0 px-2 py-1 text-lg leading-none"
            >
              ×
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {events.length === 0
              ? "Kayıt yok"
              : `${events.length} kayıt${
                  events.some((event) => event.done)
                    ? `, ${events.filter((event) => event.done).length} tamamlandı`
                    : ""
                }`}
          </p>
        </header>

        <div className="flex-1 space-y-3 px-4 py-4">
          {events.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface/60 px-3 py-6 text-center text-sm text-muted">
              Bu güne henüz bir şey eklenmedi.
              <br />
              Aşağıdaki kutudan ilk kaydı oluştur.
            </p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => {
                const repeating = event.repeat !== "yok";
                return (
                  <li
                    key={event.id}
                    className="anim-rise rounded-lg border border-line bg-surface p-3 shadow-paper"
                  >
                    <div className="flex items-start gap-3">
                      {repeating ? (
                        <span className="mt-0.5 w-12 shrink-0 text-center text-[11px] font-medium text-muted">
                          tekrar
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={event.done}
                          onChange={() => onToggleDone(event)}
                          aria-label={`${event.title} tamamlandı`}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {event.time ? (
                            <span className="tabular font-display text-sm font-semibold text-accent-ink">
                              {event.time}
                            </span>
                          ) : null}
                          <h3
                            className={`text-sm font-semibold leading-snug ${
                              event.done ? "text-muted line-through" : "text-ink"
                            }`}
                          >
                            {event.title}
                          </h3>
                        </div>
                        {event.note ? (
                          <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                            {event.note}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <TagChip tag={event.tag} />
                          {repeating ? (
                            <span className="rounded-sm bg-sunk px-1.5 py-0.5 text-[11px] text-muted">
                              {repeatLabel(event.repeat)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Button
                          tone="quiet"
                          className="px-2 py-1 text-xs"
                          onClick={() => {
                            setEditing(event);
                            setConfirming(null);
                          }}
                        >
                          Düzenle
                        </Button>
                        {confirming === event.id ? (
                          <Button
                            tone="danger"
                            className="px-2 py-1 text-xs"
                            disabled={pending}
                            onClick={() => {
                              void onDelete(event.id).then(() =>
                                setConfirming(null),
                              );
                            }}
                          >
                            Sil, eminim
                          </Button>
                        ) : (
                          <Button
                            tone="quiet"
                            className="px-2 py-1 text-xs"
                            onClick={() => setConfirming(event.id)}
                          >
                            Sil
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {editing && editing.repeat !== "yok" ? (
            <p className="rounded-md bg-accent-soft px-3 py-2 text-xs text-accent-ink">
              Bu kayıt tekrarlı. Değişiklik tüm tekrarlara işler.
            </p>
          ) : null}

          <EventForm
            key={editing?.id ?? "yeni"}
            dateKey={dateKey}
            editing={editing}
            pending={pending}
            onCancel={() => setEditing(null)}
            onSubmit={async (draft) => {
              if (editing) {
                const ok = await onUpdate(editing.id, draft);
                if (ok) setEditing(null);
                return ok;
              }
              return onCreate(draft);
            }}
          />
        </div>
      </aside>
    </div>
  );
}
