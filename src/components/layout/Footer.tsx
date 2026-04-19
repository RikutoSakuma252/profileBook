export function Footer() {
  const bars = Array.from({ length: 24 });
  return (
    <footer className="content-above-noise mt-20 border-t border-paper/10 bg-ink-deep/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-end gap-3">
          {/* EQ bars */}
          <div className="flex h-8 items-end gap-[3px]" aria-hidden>
            {bars.map((_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-sm bg-neon/70 animate-wave"
                style={{
                  height: `${20 + ((i * 37) % 80)}%`,
                  animationDelay: `${(i % 6) * 90}ms`,
                  animationDuration: `${900 + ((i * 71) % 600)}ms`,
                }}
              />
            ))}
          </div>
          <div className="font-dot text-[11px] tracking-[0.25em] text-paper/60">
            NOW PLAYING · 社内限定ブロードキャスト
          </div>
        </div>

        <div className="flex items-center gap-4 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/50">
          <span>EST. 2026</span>
          <span className="h-1 w-1 rounded-full bg-paper/30" />
          <span>DAMATEN STUDIO</span>
          <span className="h-1 w-1 rounded-full bg-paper/30" />
          <span className="text-rose-dusty">© INTERNAL USE ONLY</span>
        </div>
      </div>
    </footer>
  );
}
