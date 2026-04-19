import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-neon/80">
        Off Air · 404
      </div>
      <h1 className="font-dot text-5xl tracking-[0.08em] text-paper">
        このチャンネルは<br />
        <span className="text-rose-dusty">存在しません</span>
      </h1>
      <p className="max-w-md font-handwritten text-paper/70">
        お探しのページは電波の向こう側に消えてしまいました。
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-sm bg-neon px-4 py-2 font-dot text-sm tracking-[0.2em] text-ink shadow-neon"
        >
          back to studio
        </Link>
        <Link
          href="/profiles"
          className="rounded-sm border border-paper/20 px-4 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/70 transition-colors hover:border-neon hover:text-neon"
        >
          directory
        </Link>
      </div>
    </main>
  );
}
