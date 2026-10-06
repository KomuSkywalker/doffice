"use client";

import { useEffect, useState } from "react";
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from "@/lib/dates";
import { DURATIONS, durationLabel, type Availability } from "@/lib/types";
import { Button, Field, FieldGroup, inputClass } from "./ui";

type Props = {
  availability: Availability;
  total: number;
  pending: boolean;
  onClose: () => void;
  onPickFile: () => void;
  onSave: (value: Availability) => Promise<boolean>;
  onLogout: () => void;
};

export function SettingsDialog({
  availability,
  total,
  pending,
  onClose,
  onPickFile,
  onSave,
  onLogout,
}: Props) {
  const [days, setDays] = useState<number[]>(availability.days);
  const [start, setStart] = useState(availability.start);
  const [end, setEnd] = useState(availability.end);
  const [slotMinutes, setSlotMinutes] = useState(availability.slotMinutes);
  const [horizonDays, setHorizonDays] = useState(availability.horizonDays);
  const [note, setNote] = useState(availability.note);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl] = useState(() =>
    typeof window === "undefined" ? "/musaitlik" : `${window.location.origin}/musaitlik`,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleDay = (day: number) => {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const save = async () => {
    if (days.length === 0) {
      setError("En az bir çalışma günü seç.");
      return;
    }
    if (start >= end) {
      setError("Bitiş saati başlangıçtan sonra olmalı.");
      return;
    }
    const ok = await onSave({
      days,
      start,
      end,
      slotMinutes,
      horizonDays,
      note,
    });
    setError(ok ? null : "Kaydedilemedi, tekrar dene.");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopyalanamadı, bağlantıyı elle seç.");
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        type="button"
        aria-label="Ayarları kapat"
        onClick={onClose}
        className="anim-fade fixed inset-0 bg-ink/35"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Ayarlar"
        className="anim-rise nb relative w-full max-w-lg overflow-hidden rounded-lg bg-card shadow-nb-lg"
      >
        <header className="flex items-center justify-between border-b-2 border-ink bg-gold px-4 py-2.5">
          <h2 className="text-base font-bold tracking-tight">Ayarlar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="chip-pop nb-thin rounded-sm bg-card px-2 py-0.5 text-sm font-bold"
          >
            ×
          </button>
        </header>

        <div className="space-y-6 px-4 py-4">
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Müsaitlik bağlantısı
            </h3>
            <p className="text-sm font-medium leading-relaxed text-ink-soft">
              Bu bağlantıyı paylaştığın kişi boş gün ve saatlerini görür,
              randevu isteyebilir. Kayıtlarının içeriğini göremez.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="nb-thin min-w-0 flex-1 truncate rounded-sm bg-cream px-2.5 py-2 text-xs font-bold">
                {shareUrl || "/musaitlik"}
              </code>
              <Button tone="primary" onClick={() => void copyLink()}>
                {copied ? "Kopyalandı" : "Kopyala"}
              </Button>
              <a
                href="/musaitlik"
                target="_blank"
                rel="noreferrer"
                className="press-sm nb inline-flex rounded-md bg-card px-3.5 py-2 text-sm font-bold shadow-nb-sm"
              >
                Aç
              </a>
            </div>
          </section>

          <section className="space-y-3 border-t-2 border-ink/10 pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Çalışma düzeni
            </h3>

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
                        active ? "bg-gold" : "bg-card hover:bg-cream"
                      }`}
                    >
                      {WEEKDAY_SHORT[day]}
                    </button>
                  );
                })}
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

            <div className="grid grid-cols-2 gap-3">
              <Field label="Randevu süresi">
                <select
                  className={inputClass}
                  value={slotMinutes}
                  onChange={(event) => setSlotMinutes(Number(event.target.value))}
                >
                  {DURATIONS.map((value) => (
                    <option key={value} value={value}>
                      {durationLabel(value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kaç gün ileri" hint="7 ile 180">
                <input
                  type="number"
                  min={7}
                  max={180}
                  className={inputClass}
                  value={horizonDays}
                  onChange={(event) => setHorizonDays(Number(event.target.value))}
                />
              </Field>
            </div>

            <Field label="Bağlantıdaki not" hint="boş olabilir">
              <textarea
                className={`${inputClass} min-h-[60px] resize-y`}
                maxLength={300}
                value={note}
                placeholder="Görüşme nerede yapılacak, ne getirilmeli"
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            {error ? (
              <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
                {error}
              </p>
            ) : null}

            <Button tone="primary" disabled={pending} onClick={() => void save()}>
              Çalışma düzenini kaydet
            </Button>
          </section>

          <section className="space-y-2 border-t-2 border-ink/10 pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Veri
            </h3>
            <p className="text-sm font-medium leading-relaxed text-ink-soft">
              Şu an {total} kayıt var.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/backup"
                className="press-sm nb inline-flex rounded-md bg-card px-3.5 py-2 text-sm font-bold shadow-nb-sm"
              >
                Yedek al
              </a>
              <Button tone="plain" onClick={onPickFile}>
                Yedek yükle
              </Button>
            </div>
          </section>

          <section className="space-y-2 border-t-2 border-ink/10 pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Oturum
            </h3>
            <Button tone="plain" onClick={onLogout}>
              Çıkış yap
            </Button>
          </section>
        </div>
      </section>
    </div>
  );
}
