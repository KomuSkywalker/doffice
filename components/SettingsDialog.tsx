"use client";

import { useEffect, useState } from "react";
import { OPEN_DAY } from "@/lib/availability";
import {
  LINK_LIFETIMES,
  durationLabel,
  linkIsLive,
  type Routine,
  type RoutineDraft,
  type ShareLink,
} from "@/lib/types";
import { RoutineManager } from "./RoutineManager";
import { Button, Field, inputClass } from "./ui";

type TabId = "baglanti" | "rutin" | "sistem";

const TABS: { id: TabId; label: string }[] = [
  { id: "baglanti", label: "Bağlantılar" },
  { id: "rutin", label: "Rutinler" },
  { id: "sistem", label: "Sistem" },
];

type Props = {
  links: ShareLink[];
  routines: Routine[];
  total: number;
  pending: boolean;
  onClose: () => void;
  onPickFile: () => void;
  onCreateLink: (
    label: string,
    lifetimeDays: number,
    note: string,
  ) => Promise<boolean>;
  onRevokeLink: (id: string) => void;
  onCreateRoutine: (draft: RoutineDraft) => Promise<boolean>;
  onUpdateRoutine: (id: string, draft: Partial<RoutineDraft>) => Promise<boolean>;
  onDeleteRoutine: (id: string) => Promise<boolean>;
  onLogout: () => void;
};

export function SettingsDialog({
  links,
  routines,
  total,
  pending,
  onClose,
  onPickFile,
  onCreateLink,
  onRevokeLink,
  onCreateRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onLogout,
}: Props) {
  const [tab, setTab] = useState<TabId>("baglanti");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkLifetime, setLinkLifetime] = useState(0);
  const [linkNote, setLinkNote] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const openTab = (next: TabId) => {
    setTab(next);
    setError(null);
  };

  const copyLink = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(`${origin}/musaitlik/${link.token}`);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Kopyalanamadı, bağlantıyı elle seç.");
    }
  };

  const addLink = async () => {
    const ok = await onCreateLink(linkLabel.trim(), linkLifetime, linkNote.trim());
    if (ok) {
      setLinkLabel("");
      setLinkNote("");
      setError(null);
    } else {
      setError("Bağlantı oluşturulamadı.");
    }
  };

  const liveLinks = links.filter((link) => linkIsLive(link));
  const closedLinks = links.filter((link) => !linkIsLive(link));

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 sm:items-center">
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
        className="anim-rise nb relative flex w-full max-w-xl flex-col overflow-hidden rounded-lg bg-card shadow-nb-lg"
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

        <div
          role="tablist"
          aria-label="Ayar bölümleri"
          className="flex flex-wrap gap-2 border-b-2 border-ink/10 bg-cream px-4 py-2.5"
        >
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => openTab(item.id)}
                className={`chip-pop nb-thin rounded-sm px-2.5 py-1 text-xs font-bold ${
                  active ? "bg-gold shadow-nb-xs" : "bg-card hover:bg-paper"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          key={tab}
          className="anim-view scroll-thin max-h-[66vh] overflow-y-auto px-4 py-4"
        >
          {tab === "baglanti" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium leading-relaxed text-ink-soft">
                Bağlantı takvimini okur: {OPEN_DAY.start} ile {OPEN_DAY.end} arası{" "}
                {durationLabel(OPEN_DAY.slotMinutes)} dilimler üretir,
                kayıtlarının ve rutinlerinin kapattığı saatleri dolu gösterir.
                Karşı taraf kayıt içeriğini görmez.
              </p>

              <div className="nb-thin space-y-3 rounded-md bg-cream px-3 py-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                  <Field label="Kime veya ne için" hint="boş olabilir">
                    <input
                      className={inputClass}
                      value={linkLabel}
                      maxLength={60}
                      placeholder="Örnek: Yılmaz ailesi"
                      onChange={(event) => setLinkLabel(event.target.value)}
                    />
                  </Field>
                  <Field label="Geçerlilik">
                    <select
                      className={inputClass}
                      value={linkLifetime}
                      onChange={(event) =>
                        setLinkLifetime(Number(event.target.value))
                      }
                    >
                      {LINK_LIFETIMES.map((option) => (
                        <option key={option.days} value={option.days}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Bağlantıdaki not" hint="boş olabilir">
                  <input
                    className={inputClass}
                    value={linkNote}
                    maxLength={300}
                    placeholder="Görüşme nerede yapılacak, ne getirilmeli"
                    onChange={(event) => setLinkNote(event.target.value)}
                  />
                </Field>
                <Button
                  tone="primary"
                  disabled={pending}
                  onClick={() => void addLink()}
                >
                  Bağlantı oluştur
                </Button>
              </div>

              {error ? (
                <p className="nb-thin rounded-sm bg-coral px-2.5 py-1.5 text-xs font-bold">
                  {error}
                </p>
              ) : null}

              {liveLinks.length === 0 ? (
                <p className="nb-thin rounded-md border-dashed bg-tint/60 px-3 py-5 text-center text-sm font-bold">
                  Açık bağlantı yok. Yukarıdan oluştur.
                </p>
              ) : (
                <ul className="space-y-2">
                  {liveLinks.map((link) => (
                    <li
                      key={link.id}
                      className="nb-thin rounded-md bg-card px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">
                            {link.label}
                          </span>
                          <span className="block text-[11px] font-medium text-muted">
                            {link.expiresAt
                              ? `Son gün ${link.expiresAt.slice(0, 10)}`
                              : "Süresiz"}
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => void copyLink(link)}
                            className="chip-pop nb-thin rounded-sm bg-gold px-2.5 py-1 text-xs font-bold"
                          >
                            {copiedId === link.id ? "Kopyalandı" : "Kopyala"}
                          </button>
                          <a
                            href={`/musaitlik/${link.token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold"
                          >
                            Aç
                          </a>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => onRevokeLink(link.id)}
                            className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-xs font-bold hover:bg-coral"
                          >
                            Kapat
                          </button>
                        </span>
                      </div>
                      <code className="mt-2 block truncate text-[11px] font-bold text-muted">
                        {origin}/musaitlik/{link.token}
                      </code>
                    </li>
                  ))}
                </ul>
              )}

              {closedLinks.length > 0 ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowClosed((current) => !current)}
                    className="chip-pop nb-thin rounded-sm bg-card px-2.5 py-1 text-[11px] font-bold hover:bg-cream"
                  >
                    {showClosed
                      ? "Kapalı bağlantıları gizle"
                      : `Kapalı bağlantılar (${closedLinks.length})`}
                  </button>
                  {showClosed ? (
                    <ul className="space-y-1">
                      {closedLinks.map((link) => (
                        <li
                          key={link.id}
                          className="flex items-center justify-between gap-2 px-1 text-[11px] font-medium text-muted"
                        >
                          <span className="truncate font-bold">{link.label}</span>
                          <span className="shrink-0">
                            {link.revokedAt ? "kapatıldı" : "süresi doldu"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "rutin" ? (
            <RoutineManager
              routines={routines}
              pending={pending}
              onCreate={onCreateRoutine}
              onUpdate={onUpdateRoutine}
              onDelete={onDeleteRoutine}
            />
          ) : null}

          {tab === "sistem" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Veri
                </h3>
                <p className="text-sm font-medium leading-relaxed text-ink-soft">
                  {total} kayıt, {routines.length} rutin tutuluyor. Yedek
                  dosyası kayıtları, rutinleri ve çalışma düzenini kapsar.
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
              </div>

              <div className="space-y-2 border-t-2 border-ink/10 pt-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Oturum
                </h3>
                <Button tone="plain" onClick={onLogout}>
                  Çıkış yap
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
