"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    setClosing((current) => {
      if (!current) closeTimer.current = window.setTimeout(onClose, 160);
      return true;
    });
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const doneCount = events.filter((event) => event.done).length;

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Paneli kapat"
        onClick={requestClose}
        className={`absolute inset-0 bg-ink/35 transition-opacity duration-150 ${
          closing ? "opacity-0" : "anim-fade"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${formatLong(dateKey)} kayıtları`}
        className={`scroll-thin relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l-[3px] border-ink bg-paper ${
          closing ? "anim-panel-out" : "anim-panel"
        }`}
      >
        <header className="sticky top-0 z-10 border-b-[3px] border-ink bg-gold px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
                {relativeLabel(dateKey, today)}
              </p>
              <h2 className="mt-1 text-2xl font-bold leading-tight tracking-[-0.03em]">
                {formatLong(dateKey)}
              </h2>
              <p className="mt-1 text-xs font-bold text-ink/80">
                {events.length === 0
                  ? "Kayıt yok"
                  : `${events.length} kayıt${
                      doneCount > 0 ? `, ${doneCount} tamamlandı` : ""
                    }`}
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Kapat"
              className="nb press-sm shrink-0 rounded-md bg-card px-3 py-1.5 text-lg font-bold leading-none shadow-nb-sm"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 px-5 py-5">
          {events.length === 0 ? (
            <p className="nb rounded-lg border-dashed bg-card/70 px-4 py-8 text-center text-sm font-bold">
              Bu güne henüz bir şey eklenmedi.
              <br />
              Aşağıdaki kutudan ilk kaydı oluştur.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((event, position) => {
                const repeating = event.repeat !== "yok";
                return (
                  <li
                    key={event.id}
                    style={{ animationDelay: `${Math.min(position, 8) * 50}ms` }}
                    className="anim-rise lift nb rounded-lg bg-card p-3.5 shadow-nb-sm"
                  >
                    <div className="flex items-start gap-3">
                      {repeating ? (
                        <span className="nb-thin mt-0.5 shrink-0 rounded-sm bg-cream px-1.5 py-0.5 text-[10px] font-bold uppercase">
                          tekrar
                        </span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={event.done}
                          onChange={() => onToggleDone(event)}
                          aria-label={`${event.title} tamamlandı`}
                          className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--color-ink)]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {event.time ? (
                            <span className="tabular text-base font-bold text-rust">
                              {event.time}
                            </span>
                          ) : null}
                          <h3
                            className={`text-base font-bold leading-snug transition-all duration-200 ${
                              event.done ? "text-muted line-through opacity-70" : ""
                            }`}
                          >
                            {event.title}
                          </h3>
                        </div>
                        {event.note ? (
                          <p className="mt-1.5 whitespace-pre-line text-sm font-medium leading-relaxed text-ink-soft">
                            {event.note}
                          </p>
                        ) : null}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <TagChip tag={event.tag} />
                          {repeating ? (
                            <span className="nb-thin rounded-sm bg-cream px-2 py-0.5 text-[11px] font-bold">
                              {repeatLabel(event.repeat)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 border-t-2 border-ink/10 pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(event);
                          setConfirming(null);
                        }}
                        className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                      >
                        Düzenle
                      </button>
                      {confirming === event.id ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            void onDelete(event.id).then(() => setConfirming(null));
                          }}
                          className="chip-pop nb-thin rounded-sm bg-coral px-2.5 py-1 text-xs font-bold text-ink"
                        >
                          Sil, eminim
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(event.id)}
                          className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {editing && editing.repeat !== "yok" ? (
            <p className="nb-thin rounded-md bg-coral px-3 py-2 text-xs font-bold text-ink">
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

          <Button tone="plain" onClick={requestClose} className="w-full">
            Paneli kapat
          </Button>
        </div>
      </aside>
    </div>
  );
}
