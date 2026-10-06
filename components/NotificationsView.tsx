"use client";

import { formatLong, relativeLabel } from "@/lib/dates";
import { durationLabel, type Appointment, type AppNotification } from "@/lib/types";
import { Button, Card } from "./ui";

type Props = {
  notifications: AppNotification[];
  appointments: Appointment[];
  today: string;
  pending: boolean;
  onDecide: (id: string, approve: boolean) => void;
  onSelectDay: (key: string) => void;
};

const STATUS_LABEL: Record<Appointment["status"], string> = {
  bekliyor: "Bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
};

export function NotificationsView({
  notifications,
  appointments,
  today,
  pending,
  onDecide,
  onSelectDay,
}: Props) {
  const waiting = appointments
    .filter((row) => row.status === "bekliyor")
    .sort((left, right) => (left.date < right.date ? -1 : 1));

  const decided = appointments
    .filter((row) => row.status !== "bekliyor")
    .sort((left, right) => (left.updatedAt > right.updatedAt ? -1 : 1))
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <Card title={`Bekleyen talepler (${waiting.length})`} accent="bg-gold">
        {waiting.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-muted">
            Bekleyen randevu talebi yok.
          </p>
        ) : (
          <ul className="divide-y-2 divide-ink/10">
            {waiting.map((row, position) => (
              <li
                key={row.id}
                style={{ animationDelay: `${position * 40}ms` }}
                className="anim-rise px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold">{row.name}</p>
                    <p className="mt-0.5 text-sm font-bold text-rust">
                      {formatLong(row.date)}, {row.time} ({durationLabel(row.duration)})
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-soft">
                      {row.contact}
                    </p>
                    {row.note ? (
                      <p className="mt-1 whitespace-pre-line text-sm font-medium text-ink-soft">
                        {row.note}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-medium text-muted">
                      {relativeLabel(row.date, today)} için istendi
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      tone="primary"
                      disabled={pending}
                      onClick={() => onDecide(row.id, true)}
                    >
                      Onayla
                    </Button>
                    <Button
                      tone="plain"
                      disabled={pending}
                      onClick={() => onDecide(row.id, false)}
                    >
                      Reddet
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Geçmiş" accent="bg-gold">
        {decided.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-muted">
            Henüz sonuçlanmış talep yok.
          </p>
        ) : (
          <ul className="divide-y-2 divide-ink/10">
            {decided.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelectDay(row.date)}
                  className="row-slide flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-tint"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{row.name}</span>
                    <span className="block text-xs font-medium text-muted">
                      {formatLong(row.date)}, {row.time}
                    </span>
                  </span>
                  <span
                    className={`nb-thin rounded-sm px-2 py-0.5 text-[11px] font-bold ${
                      row.status === "onaylandi" ? "bg-mint" : "bg-cream"
                    }`}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Bildirim akışı" accent="bg-gold">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm font-bold text-muted">
            Bildirim yok.
          </p>
        ) : (
          <ul className="divide-y-2 divide-ink/10">
            {notifications.slice(0, 30).map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink ${
                    row.readAt ? "bg-cream" : "bg-coral"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{row.title}</span>
                  <span className="block text-xs font-medium text-muted">
                    {row.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
