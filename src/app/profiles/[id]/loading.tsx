export default function ProfileDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 pt-10 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <span className="h-3 w-32 rounded-sm bg-paper/10" />
        <span className="h-3 w-24 rounded-sm bg-paper/10" />
      </div>

      <article className="paper-grain relative rounded-sm p-8 opacity-70 shadow-card md:p-10">
        <header className="flex flex-col gap-5 border-b border-dashed border-ink/20 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 rounded-sm bg-ink/15" />
            <div className="space-y-2">
              <span className="block h-3 w-28 rounded-sm bg-ink/10" />
              <span className="block h-7 w-48 rounded-sm bg-ink/15" />
              <span className="block h-4 w-60 rounded-sm bg-ink/10" />
            </div>
          </div>
        </header>

        <ul className="mt-8 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-sm border border-ink/10 bg-ink/[0.03] px-4 py-3"
            >
              <span className="h-3 w-6 rounded-sm bg-ink/10" />
              <div className="flex-1 space-y-2">
                <span className="block h-3 w-40 rounded-sm bg-ink/10" />
                <span className="block h-6 w-40 rounded-sm bg-ink/20" />
              </div>
            </li>
          ))}
        </ul>
      </article>
    </main>
  );
}
