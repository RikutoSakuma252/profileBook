import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 content-above-noise border-b border-paper/10 bg-ink-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-neon animate-blink shadow-neon" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-neon-glow" />
          </span>
          <span className="flex items-baseline gap-2 font-dot text-paper">
            <span className="text-[13px] tracking-[0.3em] text-neon">ON AIR</span>
            <span className="text-[11px] tracking-[0.25em] text-paper/60">93.5FM</span>
          </span>
          <span className="ml-3 hidden border-l border-paper/20 pl-3 font-dot text-sm tracking-[0.2em] text-paper group-hover:text-neon sm:inline-block">
            ダマテン ラジオ 名簿
          </span>
        </Link>

        <nav className="flex items-center gap-5 font-typewriter text-xs uppercase tracking-[0.2em] text-paper/70">
          <Link href="/profiles" className="transition-colors hover:text-neon">
            Directory
          </Link>
          {isAdmin && (
            <Link href="/admin" className="transition-colors hover:text-neon">
              Studio
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 border-l border-paper/20 pl-5">
              <div className="hidden items-center gap-2 md:flex">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-neon/20 font-dot text-[11px] text-neon">
                  {user.name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="font-dot text-[11px] tracking-[0.2em] text-paper/80">
                  {user.name ?? user.email}
                </span>
                {isAdmin && (
                  <span className="rounded-sm bg-rouge/80 px-1.5 py-0.5 font-dot text-[9px] tracking-[0.3em] text-paper">
                    ADMIN
                  </span>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-sm border border-paper/20 px-2.5 py-1 text-[10px] tracking-[0.25em] transition-colors hover:border-rose hover:text-rose"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-sm border border-neon/60 px-3 py-1 text-[11px] text-neon transition-colors hover:bg-neon hover:text-ink"
            >
              Check-in
            </Link>
          )}
        </nav>
      </div>

      <div className="h-[6px] frequency-bar-strong opacity-40" />
    </header>
  );
}
