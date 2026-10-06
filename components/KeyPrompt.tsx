"use client";

import { useState } from "react";
import { Button, Field, inputClass } from "./ui";

type Props = {
  onSubmit: (key: string) => void;
  onClose: () => void;
};

export function KeyPrompt({ onSubmit, onClose }: Props) {
  const [value, setValue] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-ink/35"
      />
      <form
        className="anim-rise nb relative w-full max-w-sm space-y-3.5 rounded-lg bg-card p-5 shadow-nb-lg"
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim().length > 0) onSubmit(value.trim());
        }}
      >
        <h2 className="text-xl font-bold tracking-tight">Panel anahtarı</h2>
        <p className="text-sm font-medium leading-relaxed text-muted">
          Bu almanakta yazma işlemleri anahtarla korunuyor.
          Anahtarı gir, oturum boyunca hatırlanır.
        </p>
        <Field label="Anahtar">
          <input
            autoFocus
            type="password"
            className={inputClass}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>
        <div className="flex items-center gap-2">
          <Button type="submit" tone="primary">
            Kaydet
          </Button>
          <Button tone="quiet" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
      </form>
    </div>
  );
}
