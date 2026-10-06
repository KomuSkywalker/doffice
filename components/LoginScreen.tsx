"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button, Field, inputClass } from "./ui";

export function LoginScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(payload.error ?? "Giriş yapılamadı.");
        return;
      }
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form
        className="anim-rise nb w-full max-w-sm space-y-5 rounded-lg bg-card p-6 shadow-nb-lg"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-bold leading-none tracking-[-0.03em]">
              Doffice
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">
              Kişisel ofis paneli
            </p>
          </div>
        </div>

        <Field label="Şifre">
          <input
            autoFocus
            type="password"
            autoComplete="current-password"
            className={inputClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {error ? (
          <p className="nb-thin rounded-sm bg-coral px-3 py-2 text-xs font-bold">
            {error}
          </p>
        ) : null}

        <Button type="submit" tone="primary" disabled={pending} className="w-full">
          {pending ? "Kontrol ediliyor" : "Gir"}
        </Button>

      </form>
    </main>
  );
}
