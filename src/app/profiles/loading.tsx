export default function ProfilesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <header className="mb-10 border-b border-paper/10 pb-6">
        <div className="h-3 w-28 rounded-sm bg-paper/10" />
        <div className="mt-3 h-9 w-72 rounded-sm bg-paper/10" />
        <div className="mt-3 h-4 w-56 rounded-sm bg-paper/10" />
      </header>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <article className="paper-grain relative rounded-sm p-5 opacity-60 shadow-card">
              <header className="flex items-center justify-between border-b border-dashed border-ink/20 pb-3">
                <span className="h-3 w-20 rounded-sm bg-ink/15" />
                <span className="h-3 w-16 rounded-sm bg-ink/15" />
              </header>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-12 w-12 rounded-sm bg-ink/15" />
                <div className="flex-1 space-y-2">
                  <span className="block h-4 w-32 rounded-sm bg-ink/15" />
                  <span className="block h-3 w-40 rounded-sm bg-ink/10" />
                </div>
              </div>
              <footer className="mt-5 flex items-center justify-between border-t border-dotted border-ink/20 pt-3">
                <span className="h-2 w-16 rounded-sm bg-ink/10" />
                <span className="h-2 w-6 rounded-sm bg-ink/10" />
              </footer>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
