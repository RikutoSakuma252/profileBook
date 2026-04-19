import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LIMIT = 12;
const SORTS = [
  { key: "newest", label: "新着順" },
  { key: "oldest", label: "古い順" },
  { key: "name", label: "名前順" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function buildHref(
  base: { search: string; sort: SortKey; page: number },
  overrides: Partial<{ search: string; sort: SortKey; page: number }>
) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  if (merged.search) params.set("search", merged.search);
  if (merged.sort !== "newest") params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `/profiles?${qs}` : "/profiles";
}

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const search = (str(sp.search) ?? "").trim();
  const sortRaw = str(sp.sort) ?? "newest";
  const sort: SortKey = SORTS.some((s) => s.key === sortRaw) ? (sortRaw as SortKey) : "newest";
  const pageRaw = Number(str(sp.page) ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const where = search
    ? {
        OR: [
          { displayName: { contains: search } },
          { subtitle: { contains: search } },
        ],
      }
    : undefined;

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "name"
        ? { displayName: "asc" as const }
        : { createdAt: "desc" as const };

  const [total, profiles] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const clampedPage = Math.min(page, totalPages);
  const base = { search, sort, page: clampedPage };

  return (
    <main className="relative mx-auto max-w-6xl px-6 pt-12 pb-24">
      <header className="mb-10 flex flex-col gap-3 border-b border-paper/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-neon/80">
            Directory · All Dossiers
          </div>
          <h1 className="mt-2 font-dot text-4xl tracking-[0.08em] text-paper md:text-5xl">
            みんなの<span className="text-neon">ラジオ名簿</span>
          </h1>
          <p className="mt-2 font-handwritten text-paper/60">
            合計 {total} 通の密告ファイル。名前で検索できます。
          </p>
        </div>

        <form
          action="/profiles"
          method="get"
          className="flex w-full items-center gap-2 md:w-[320px]"
        >
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <label className="relative flex-1">
            <span className="sr-only">検索</span>
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="ラジオネームで検索…"
              className="w-full rounded-sm border border-paper/15 bg-ink-soft/40 px-3 py-2 font-typewriter text-sm text-paper placeholder:text-paper/40 focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon/60"
            />
          </label>
          <button
            type="submit"
            className="rounded-sm border border-neon/60 px-3 py-2 font-typewriter text-[11px] uppercase tracking-[0.25em] text-neon transition-colors hover:bg-neon hover:text-ink"
          >
            Tune
          </button>
        </form>
      </header>

      <nav className="mb-8 flex flex-wrap items-center gap-2 font-typewriter text-[11px] uppercase tracking-[0.25em]">
        <span className="text-paper/40">Sort —</span>
        {SORTS.map((s) => {
          const active = s.key === sort;
          return (
            <Link
              key={s.key}
              href={buildHref(base, { sort: s.key, page: 1 })}
              className={
                active
                  ? "rounded-sm bg-neon px-3 py-1 text-ink"
                  : "rounded-sm border border-paper/15 px-3 py-1 text-paper/70 transition-colors hover:border-neon hover:text-neon"
              }
            >
              {s.label}
            </Link>
          );
        })}
        {search && (
          <Link
            href={buildHref(base, { search: "", page: 1 })}
            className="ml-auto rounded-sm border border-rose/60 px-3 py-1 text-rose transition-colors hover:bg-rose hover:text-ink"
          >
            Clear “{search}”
          </Link>
        )}
      </nav>

      {profiles.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => {
            const no = (clampedPage - 1) * LIMIT + i + 1;
            return (
              <li key={p.id}>
                <Link
                  href={`/profiles/${p.id}`}
                  className="group relative block"
                >
                  <span
                    className="tape left-8 -top-2 rotate-[-5deg] z-10"
                    aria-hidden
                  />
                  <article className="paper-grain relative rounded-sm p-5 text-ink shadow-card transition-transform group-hover:-translate-y-1">
                    <header className="flex items-center justify-between border-b border-dashed border-ink/30 pb-3 font-dot text-[10px] tracking-[0.25em] text-ink/60">
                      <span>FILE No. {String(no).padStart(3, "0")}</span>
                      <span>{p.createdAt.toISOString().slice(0, 10)}</span>
                    </header>
                    <div className="mt-4 flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid h-12 w-12 place-items-center rounded-sm font-dot text-lg shadow-sm"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.displayName.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-dot text-base tracking-[0.08em] text-ink">
                          {p.displayName}
                        </div>
                        {p.subtitle && (
                          <div className="truncate font-handwritten text-sm text-ink/70">
                            {p.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <footer className="mt-4 flex items-center justify-between border-t border-dotted border-ink/30 pt-3 font-typewriter text-[10px] uppercase tracking-[0.3em] text-ink/50">
                      <span>tap to open</span>
                      <span className="text-rouge">秘</span>
                    </footer>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-between border-t border-paper/10 pt-6 font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/70">
          {clampedPage > 1 ? (
            <Link
              href={buildHref(base, { page: clampedPage - 1 })}
              className="rounded-sm border border-paper/20 px-3 py-1 transition-colors hover:border-neon hover:text-neon"
            >
              ← Prev
            </Link>
          ) : (
            <span className="rounded-sm border border-paper/10 px-3 py-1 text-paper/30">
              ← Prev
            </span>
          )}
          <span className="font-dot tracking-[0.2em] text-paper/60">
            Page {clampedPage} / {totalPages}
          </span>
          {clampedPage < totalPages ? (
            <Link
              href={buildHref(base, { page: clampedPage + 1 })}
              className="rounded-sm border border-paper/20 px-3 py-1 transition-colors hover:border-neon hover:text-neon"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-sm border border-paper/10 px-3 py-1 text-paper/30">
              Next →
            </span>
          )}
        </nav>
      )}
    </main>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="rounded-sm border border-dashed border-paper/20 bg-ink-soft/30 p-10 text-center">
      <div className="font-typewriter text-[11px] uppercase tracking-[0.3em] text-paper/40">
        No transmission
      </div>
      <p className="mt-3 font-handwritten text-paper/70">
        {search
          ? `「${search}」に一致するプロフィールはまだ届いていません。`
          : "プロフィールはまだ取り込まれていません。"}
      </p>
    </div>
  );
}
