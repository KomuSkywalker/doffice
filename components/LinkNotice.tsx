import { Logo } from "./Logo";

export function LinkNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="nb max-w-md space-y-3 rounded-lg bg-card p-6 shadow-nb-lg">
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <h1 className="text-xl font-bold tracking-tight">Bağlantı geçersiz</h1>
        </div>
        <p className="text-sm font-medium leading-relaxed text-ink-soft">
          Bu müsaitlik bağlantısı kapatılmış ya da süresi dolmuş olabilir.
          Randevu almak istiyorsan yeni bir bağlantı iste.
        </p>
      </section>
    </main>
  );
}
