export default function RootLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 font-typewriter text-[11px] uppercase tracking-[0.3em] text-paper/60">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-neon animate-blink shadow-neon" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-neon-glow" />
        </span>
        <span>tuning signal…</span>
      </div>
    </div>
  );
}
