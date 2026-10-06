export function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="nb max-w-md space-y-3 rounded-lg bg-card p-6 shadow-nb-lg">
        <h1 className="text-xl font-bold tracking-tight">Kurulum tamamlanmadı</h1>
        <p className="text-sm font-medium leading-relaxed text-ink-soft">
          Bu kurulumda giriş şifresi tanımlı değil, bu yüzden panel kapalı.
          Sunucuda <span className="font-bold">DOFFICE_PASSWORD</span> ortam
          değişkenini tanımlayıp yeniden dağıt.
        </p>
      </div>
    </main>
  );
}
