"use client";

import { useState } from "react";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/dates";
import { daysLabel, spanLabel } from "@/lib/routines";
import {
  DEFAULT_COLOR,
  DEFAULT_ROUTINE_END,
  DEFAULT_ROUTINE_START,
  type Routine,
  type RoutineDraft,
} from "@/lib/types";
import { Button, Dot, Field, FieldGroup, MarkerPicker, inputClass } from "./ui";

type Props = {
  routines: Routine[];
  pending: boolean;
  onCreate: (draft: RoutineDraft) => Promise<boolean>;
  onUpdate: (id: string, draft: Partial<RoutineDraft>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

const QUICK_PICKS: { label: string; days: number[] }[] = [
  { label: "Her gün", days: [0, 1, 2, 3, 4, 5, 6] },
  { label: "Hafta içi", days: [0, 1, 2, 3, 4] },
  { label: "Hafta sonu", days: [5, 6] },
];

export function RoutineManager({
  routines,
  pending,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [start, setStart] = useState(DEFAULT_ROUTINE_START);
  const [end, setEnd] = useState(DEFAULT_ROUTINE_END);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [note, setNote] = useState("");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [showRange, setShowRange] = useState(false);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setDays([0, 1, 2, 3, 4]);
    setStart(DEFAULT_ROUTINE_START);
    setEnd(DEFAULT_ROUTINE_END);
    setLabel("");
    setColor(DEFAULT_COLOR);
    setNote("");
    setFrom("");
    setUntil("");
    setShowRange(false);
    setError(null);
  };

  const startEdit = (routine: Routine) => {
    setEditingId(routine.id);
    setTitle(routine.title);
    setDays(routine.days);
    setStart(routine.start);
    setEnd(routine.end);
    setLabel(routine.label ?? "");
    setColor(routine.color);
    setNote(routine.note ?? "");
    setFrom(routine.from ?? "");
    setUntil(routine.until ?? "");
    setShowRange(Boolean(routine.from || routine.until));
    setError(null);
    setConfirming(null);
  };

  const toggleDay = (day: number) => {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const submit = async () => {
    if (title.trim().length === 0) {
      setError("Rutine bir ad ver.");
      return;
    }
    if (days.length === 0) {
      setError("En az bir gün seç.");
      return;
    }
    if (start >= end) {
      setError("Bitiş saati başlangıçtan sonra olmalı.");
      return;
    }
    if (from.length > 0 && until.length > 0 && from > until) {
      setError("Son gün ilk günden sonra olmalı.");
      return;
    }

    const draft: RoutineDraft = {
      title: title.trim(),
      days,
      start,
      end,
      label: label.trim().length === 0 ? null : label.trim(),
      color,
      note: note.trim().length === 0 ? null : note.trim(),
      from: from.length === 0 ? null : from,
      until: until.length === 0 ? null : until,
      active: true,
    };

    const ok = editingId
      ? await onUpdate(editingId, draft)
      : await onCreate(draft);

    if (ok) reset();
    else setError("Kaydedilemedi, tekrar dene.");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-relaxed text-ink-soft">
        Her hafta tekrar eden sabit işlerin. Seçtiğin günlerde takvimde
        görünür, müsaitlik bağlantısında o saatleri kapatır.
      </p>

      <div className="nb-thin space-y-3 rounded-md bg-cream px-3 py-3">
        <Field label={editingId ? "Rutini düzenle" : "Yeni rutin"}>
          <input
            className={inputClass}
            value={title}
            maxLength={120}
            placeholder="Örnek: Ders"
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <FieldGroup label="Günler">
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_NAMES.map((label, day) => {
              const active = days.includes(day);
              return (
                <button
                  key={label}
                  title={label}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={active}
                  className={`chip-pop nb-thin rounded-sm px-2.5 py-1 text-xs font-bold ${
                    active ? "bg-gold" : "bg-card hover:bg-paper"
                  }`}
                >
                  {WEEKDAY_SHORT[day]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => setDays(pick.days)}
                className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-[11px] font-bold hover:bg-paper"
              >
                {pick.label}
              </button>
            ))}
          </div>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Başlangıç">
            <input
              type="time"
              className={inputClass}
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </Field>
          <Field label="Bitiş">
            <input
              type="time"
              className={inputClass}
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </Field>
        </div>

        <FieldGroup label="Etiket ve renk">
          <MarkerPicker
            label={label}
            color={color}
            onLabel={setLabel}
            onColor={setColor}
          />
        </FieldGroup>

        <Field label="Not" hint="boş olabilir">
          <input
            className={inputClass}
            value={note}
            maxLength={300}
            placeholder="Nerede, kiminle"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>

        {showRange ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="İlk gün" hint="boş olabilir">
              <input
                type="date"
                className={inputClass}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field label="Son gün" hint="boş olabilir">
              <input
                type="date"
                className={inputClass}
                value={until}
                onChange={(event) => setUntil(event.target.value)}
              />
            </Field>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRange(true)}
            className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-[11px] font-bold hover:bg-paper"
          >
            Tarih aralığı ver
          </button>
        )}

        {error ? (
          <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button tone="primary" disabled={pending} onClick={() => void submit()}>
            {editingId ? "Rutini güncelle" : "Rutin ekle"}
          </Button>
          {editingId ? (
            <Button tone="plain" onClick={reset}>
              Vazgeç
            </Button>
          ) : null}
        </div>
      </div>

      {routines.length === 0 ? (
        <p className="nb-thin rounded-md border-dashed bg-tint/60 px-3 py-5 text-center text-sm font-bold">
          Henüz rutin yok. Yukarıdan ekle.
        </p>
      ) : (
        <ul className="space-y-2">
          {routines.map((routine) => (
            <li key={routine.id} className="nb-thin rounded-md bg-card px-3 py-2.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <Dot color={routine.color} size={10} />
                    <span className="text-sm font-bold">{routine.title}</span>
                    {routine.active ? null : (
                      <span className="nb-thin rounded-sm bg-tint px-1.5 py-0.5 text-[10px] font-bold uppercase">
                        durduruldu
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-bold text-muted">
                    {daysLabel(routine.days)}, {spanLabel(routine)}
                  </span>
                  {routine.from || routine.until ? (
                    <span className="block text-[11px] font-medium text-muted">
                      {routine.from ?? "başlangıçsız"} ile{" "}
                      {routine.until ?? "bitişsiz"} arası
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(routine)}
                    className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      void onUpdate(routine.id, { active: !routine.active });
                    }}
                    className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                  >
                    {routine.active ? "Durdur" : "Başlat"}
                  </button>
                  {confirming === routine.id ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        void onDelete(routine.id).then(() => {
                          setConfirming(null);
                          if (editingId === routine.id) reset();
                        });
                      }}
                      className="chip-pop nb-thin rounded-sm bg-coral px-2.5 py-1 text-xs font-bold"
                    >
                      Sil, eminim
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(routine.id)}
                      className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-cream"
                    >
                      Sil
                    </button>
                  )}
                </span>
              </div>
              {routine.note ? (
                <p className="mt-1.5 text-[13px] font-medium text-ink-soft">
                  {routine.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
