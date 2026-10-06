"use client";

import { useEffect, useRef, useState } from "react";
import type { DofficeEvent, EventDraft, Repeat, TagId } from "@/lib/types";
import { DEFAULT_DURATION, DURATIONS, durationLabel, REPEATS } from "@/lib/types";
import { Button, Field, FieldGroup, TagPicker, inputClass } from "./ui";

type Props = {
  dateKey: string;
  editing: DofficeEvent | null;
  pending: boolean;
  onSubmit: (draft: EventDraft) => Promise<boolean>;
  onCancel: () => void;
};

export function EventForm({
  dateKey,
  editing,
  pending,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [time, setTime] = useState(editing?.time ?? "");
  const [duration, setDuration] = useState(editing?.duration ?? DEFAULT_DURATION);
  const [tag, setTag] = useState<TagId>(editing?.tag ?? "genel");
  const [repeat, setRepeat] = useState<Repeat>(editing?.repeat ?? "yok");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(editing?.date ?? dateKey);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  const submit = async () => {
    if (title.trim().length === 0) {
      setError("Başlık gerekli.");
      titleRef.current?.focus();
      return;
    }
    const draft: EventDraft = {
      date: editing ? date : dateKey,
      title: title.trim(),
      time: time.length > 0 ? time : null,
      duration,
      note: note.trim().length > 0 ? note.trim() : null,
      tag,
      repeat,
    };
    const done = await onSubmit(draft);
    if (!done) {
      setError("Kaydedilemedi, tekrar dene.");
      return;
    }
    setError(null);
    if (!editing) {
      setTitle("");
      setTime("");
      setNote("");
      setRepeat("yok");
      titleRef.current?.focus();
    }
  };

  return (
    <form
      className="nb space-y-3.5 rounded-lg bg-card p-4 shadow-nb-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight">
          {editing ? "Kaydı düzenle" : "Yeni kayıt"}
        </h3>
        {editing ? (
          <Button tone="quiet" onClick={onCancel} className="px-2 py-1 text-xs">
            Vazgeç
          </Button>
        ) : null}
      </div>

      <Field label="Başlık">
        <input
          ref={titleRef}
          className={inputClass}
          value={title}
          maxLength={160}
          placeholder="Ne olacak?"
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Saat" hint="boş olabilir">
          <input
            type="time"
            className={inputClass}
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </Field>
        <Field label="Süre" hint="müsaitliği kapatır">
          <select
            className={inputClass}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          >
            {DURATIONS.map((value) => (
              <option key={value} value={value}>
                {durationLabel(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tekrar">
          <select
            className={inputClass}
            value={repeat}
            onChange={(event) => setRepeat(event.target.value as Repeat)}
          >
            {REPEATS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        {editing ? (
          <Field label="Tarih">
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
        ) : (
          <span />
        )}
      </div>

      <FieldGroup label="Etiket">
        <TagPicker value={tag} onChange={setTag} />
      </FieldGroup>

      <Field label="Not" hint="boş olabilir">
        <textarea
          className={`${inputClass} min-h-[84px] resize-y`}
          value={note}
          maxLength={2000}
          placeholder="Detay, adres, kişi"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      {error ? (
        <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold text-ink">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" tone="primary" disabled={pending}>
          {editing ? "Kaydet" : "Güne ekle"}
        </Button>
        <span className="text-xs font-medium text-muted">
          {editing ? "Enter ile kaydet" : "Enter ile ekle"}
        </span>
      </div>
    </form>
  );
}
