"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-rouge">
        Transmission Error
      </div>
      <h1 className="font-dot text-4xl tracking-[0.08em] text-paper">
        電波が<span className="text-neon">途切れました</span>
      </h1>
      <p className="max-w-md font-handwritten text-paper/70">
        何かがうまく行かなかったようです。少し時間を置いてもう一度お試しください。
      </p>
      {error.digest && (
        <code className="rounded-sm border border-paper/10 bg-ink-soft/40 px-3 py-1 font-typewriter text-[11px] text-paper/50">
          ref: {error.digest}
        </code>
      )}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-neon px-4 py-2 font-dot text-sm tracking-[0.2em] text-ink shadow-neon"
        >
          retry
        </button>
        <Link
          href="/"
          className="rounded-sm border border-paper/20 px-4 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/70 transition-colors hover:border-neon hover:text-neon"
        >
          home
        </Link>
      </div>
    </main>
  );
}
