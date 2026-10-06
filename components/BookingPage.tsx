"use client";

import { useCallback, useState } from "react";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  formatLong,
  parseKey,
  weekdayOfKey,
} from "@/lib/dates";
import { durationLabel } from "@/lib/types";
import { Logo } from "./Logo";
import { Button, Field, inputClass } from "./ui";

type Slot = { time: string; endTime: string };
type Day = { key: string; slots: Slot[] };

type Payload = {
  month: string;
  today: string;
  availability: {
    days: number[];
    start: string;
    end: string;
    slotMinutes: number;
    note: string;
  };
  days: Day[];
};

function monthLabel(month: string) {
  const parts = parseKey(`${month}-01`);
  return `${MONTH_NAMES[parts.month]} ${parts.year}`;
}

function shiftMonthKey(month: string, delta: number) {
  const parts = parseKey(`${month}-01`);
  const stamp = new Date(Date.UTC(parts.year, parts.month + delta, 1));
  return `${stamp.getUTCFullYear()}-${String(stamp.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function BookingPage({
  initial,
  token,
}: {
  initial: Payload;
  token: string;
}) {
  const [data, setData] = useState(initial);
  const [month, setMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [trap, setTrap] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (target: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/musaitlik?ay=${target}&k=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as Payload;
        setData(payload);
        setSelectedDay(null);
        setSelectedSlot(null);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const goMonth = useCallback(
    (delta: number) => {
      const target = shiftMonthKey(month, delta);
      setMonth(target);
      void load(target);
    },
    [load, month],
  );

  const submit = async () => {
    if (!selectedDay || !selectedSlot) {
      setError("Önce gün ve saat seç.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/randevu", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: selectedDay,
          time: selectedSlot,
          name,
          contact,
          note,
          sirket: trap,
          token,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Randevu oluşturulamadı.");
        if (response.status === 409) await load(month);
        return;
      }
      setDone({ date: selectedDay, time: selectedSlot });
      setName("");
      setContact("");
      setNote("");
      setSelectedSlot(null);
      await load(month);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setPending(false);
    }
  };

  const activeDay = data.days.find((day) => day.key === selectedDay) ?? null;

  if (done) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <section className="anim-rise nb space-y-4 rounded-lg bg-card p-6 shadow-nb-lg">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <h1 className="text-2xl font-bold tracking-[-0.03em]">
              Talebin alındı
            </h1>
          </div>
          <p className="nb-thin rounded-md bg-gold px-3 py-2 text-sm font-bold">
            {formatLong(done.date)}, saat {done.time}
          </p>
          <p className="text-sm font-medium leading-relaxed text-ink-soft">
            Randevu onayı bekliyor. Onaylandığında sana dönüş yapılacak, o yüzden
            iletişim bilgini kontrol et.
          </p>
          <Button tone="plain" onClick={() => setDone(null)}>
            Yeni talep oluştur
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <header className="flex items-center gap-3">
        <Logo className="h-12 w-12" />
        <div>
          <h1 className="text-2xl font-bold leading-none tracking-[-0.03em]">
            Müsait saatler
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Randevu talebi oluştur
          </p>
        </div>
      </header>

      {data.availability.note ? (
        <p className="nb rounded-lg bg-card px-4 py-3 text-sm font-medium shadow-nb-sm">
          {data.availability.note}
        </p>
      ) : null}

      <section className="nb overflow-hidden rounded-lg bg-card shadow-nb">
        <header className="flex items-center justify-between gap-2 border-b-2 border-ink bg-gold px-4 py-2.5">
          <h2 className="text-base font-bold tracking-tight">{monthLabel(month)}</h2>
          <span className="flex gap-2">
            <button
              type="button"
              aria-label="Önceki ay"
              onClick={() => goMonth(-1)}
              disabled={month <= data.today.slice(0, 7)}
              className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-sm font-bold disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Sonraki ay"
              onClick={() => goMonth(1)}
              className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-sm font-bold"
            >
              ›
            </button>
          </span>
        </header>

        <div className="px-4 py-4">
          <p className="mb-3 text-sm font-medium text-ink-soft">
            Çalışma saatleri {data.availability.start} ile {data.availability.end}{" "}
            arası, her görüşme {durationLabel(data.availability.slotMinutes)}.
          </p>

          {loading ? (
            <p className="py-6 text-center text-sm font-bold text-muted">
              Yükleniyor
            </p>
          ) : data.days.length === 0 ? (
            <p className="nb-thin rounded-md border-dashed bg-tint/60 px-4 py-8 text-center text-sm font-bold">
              Bu ayda boş saat kalmadı. Sonraki aya bak.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.days.map((day) => {
                const parts = parseKey(day.key);
                const active = day.key === selectedDay;
                return (
                  <li key={day.key}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(day.key);
                        setSelectedSlot(null);
                      }}
                      className={`press-sm nb flex min-w-[76px] flex-col items-center rounded-md px-2.5 py-2 ${
                        active ? "bg-gold shadow-nb-sm" : "bg-card hover:bg-tint"
                      }`}
                    >
                      <span className="tabular text-lg font-bold leading-none">
                        {parts.day}
                      </span>
                      <span className="text-[11px] font-bold uppercase text-muted">
                        {WEEKDAY_SHORT[weekdayOfKey(day.key)]}
                      </span>
                      <span className="tabular mt-1 text-[11px] font-medium text-muted">
                        {day.slots.length} saat
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {activeDay ? (
        <section className="nb overflow-hidden rounded-lg bg-card shadow-nb">
          <header className="border-b-2 border-ink bg-gold px-4 py-2.5">
            <h2 className="text-base font-bold tracking-tight">
              {formatLong(activeDay.key)}
            </h2>
          </header>
          <div className="space-y-4 px-4 py-4">
            <ul className="flex flex-wrap gap-2">
              {activeDay.slots.map((slot) => (
                <li key={slot.time}>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`chip-pop tabular nb-thin rounded-sm px-3 py-1.5 text-sm font-bold ${
                      slot.time === selectedSlot
                        ? "bg-gold shadow-nb-xs"
                        : "bg-card hover:bg-tint"
                    }`}
                  >
                    {slot.time}
                  </button>
                </li>
              ))}
            </ul>

            {selectedSlot ? (
              <form
                className="space-y-3 border-t-2 border-ink/10 pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <p className="text-sm font-bold">
                  Seçilen saat {selectedSlot}, süre{" "}
                  {durationLabel(data.availability.slotMinutes)}.
                </p>
                <Field label="Ad soyad">
                  <input
                    className={inputClass}
                    value={name}
                    maxLength={80}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
                <Field label="Telefon veya e-posta">
                  <input
                    className={inputClass}
                    value={contact}
                    maxLength={120}
                    onChange={(event) => setContact(event.target.value)}
                  />
                </Field>
                <Field label="Konu" hint="boş olabilir">
                  <textarea
                    className={`${inputClass} min-h-[70px] resize-y`}
                    value={note}
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </Field>
                <input
                  type="text"
                  name="sirket"
                  value={trap}
                  onChange={(event) => setTrap(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="hidden"
                />

                {error ? (
                  <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" tone="primary" disabled={pending}>
                  {pending ? "Gönderiliyor" : "Randevu iste"}
                </Button>
              </form>
            ) : (
              <p className="text-sm font-medium text-muted">
                Devam etmek için bir saat seç.
              </p>
            )}
          </div>
        </section>
      ) : null}

      <p className="text-center text-xs font-medium text-muted">
        Doffice ile oluşturuldu
      </p>
    </main>
  );
}
