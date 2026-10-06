"use client";

import { useEffect } from "react";
import { Button } from "./ui";

type Props = {
  locked: boolean;
  hasKey: boolean;
  total: number;
  onClose: () => void;
  onUnlock: () => void;
  onPickFile: () => void;
};

export function SettingsDialog({
  locked,
  hasKey,
  total,
  onClose,
  onUnlock,
  onPickFile,
}: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Ayarları kapat"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-ink/35"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Ayarlar"
        className="anim-rise nb relative w-full max-w-md overflow-hidden rounded-lg bg-card shadow-nb-lg"
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

        <div className="space-y-5 px-4 py-4">
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Veri
            </h3>
            <p className="text-sm font-medium leading-relaxed text-ink-soft">
              Şu an {total} kayıt var. Veriler bu bilgisayardaki
              {" "}
              <span className="font-bold">data/events.json</span> dosyasında
              durur, dışarı gitmez.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
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
              Yazma kilidi
            </h3>
            {locked ? (
              <>
                <p className="text-sm font-medium leading-relaxed text-ink-soft">
                  {hasKey
                    ? "Anahtar girildi, bu sekmede kayıt ekleyip silebilirsin."
                    : "Kayıt eklemek ve silmek için panel anahtarı gerekiyor."}
                </p>
                <Button
                  tone={hasKey ? "plain" : "primary"}
                  onClick={onUnlock}
                  className="mt-1"
                >
                  {hasKey ? "Anahtarı değiştir" : "Anahtar gir"}
                </Button>
              </>
            ) : (
              <p className="text-sm font-medium leading-relaxed text-ink-soft">
                Kilit kapalı. Yazma işlemleri serbest, yerel kullanım için
                uygun.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
