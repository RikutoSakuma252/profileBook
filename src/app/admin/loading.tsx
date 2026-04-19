export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <header className="mb-10 border-b border-paper/10 pb-6">
        <div className="h-3 w-40 rounded-sm bg-paper/10" />
        <div className="mt-3 h-9 w-60 rounded-sm bg-paper/10" />
        <div className="mt-3 h-4 w-72 rounded-sm bg-paper/10" />
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm border border-paper/10 bg-ink-soft/40 p-5"
          >
            <span className="block h-3 w-24 rounded-sm bg-paper/10" />
            <span className="mt-4 block h-8 w-20 rounded-sm bg-paper/10" />
            <span className="mt-2 block h-3 w-32 rounded-sm bg-paper/10" />
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm border border-paper/10 bg-ink-soft/30 p-6"
          >
            <span className="block h-3 w-16 rounded-sm bg-paper/10" />
            <span className="mt-3 block h-6 w-40 rounded-sm bg-paper/10" />
            <span className="mt-3 block h-4 w-full rounded-sm bg-paper/10" />
          </div>
        ))}
      </section>
    </main>
  );
}
