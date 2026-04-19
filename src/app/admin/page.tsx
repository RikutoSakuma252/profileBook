import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [profileCount, configCount, recentLogs, lastLog] = await Promise.all([
    prisma.profile.count(),
    prisma.formConfig.count(),
    prisma.importLog.findMany({
      orderBy: { importedAt: "desc" },
      take: 5,
    }),
    prisma.importLog.findFirst({ orderBy: { importedAt: "desc" } }),
  ]);

  const lastImportedAt = lastLog?.importedAt
    ? lastLog.importedAt.toISOString().replace("T", " ").slice(0, 16) + " UTC"
    : "—";

  return (
    <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <header className="mb-10 border-b border-paper/10 pb-6">
        <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-neon/80">
          Studio · Control Room
        </div>
        <h1 className="mt-2 font-dot text-4xl tracking-[0.08em] text-paper md:text-5xl">
          管理<span className="text-neon">スタジオ</span>
        </h1>
        <p className="mt-2 font-handwritten text-paper/60">
          放送の裏側。取り込みの実行とフォーム設定はここから。
        </p>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Profiles" value={String(profileCount)} hint="登録済みメンバー" />
        <StatCard label="Form Configs" value={String(configCount)} hint="接続中フォーム" />
        <StatCard label="Last Import" value={lastImportedAt} hint="最終取り込み" mono />
      </section>

      <section className="mb-12 grid gap-4 md:grid-cols-2">
        <AdminNavCard
          href="/admin/import"
          title="取り込み管理"
          description="手動で Google Sheets から取り込み実行。過去の履歴も確認できます。"
          label="Import"
        />
        <AdminNavCard
          href="/admin/config"
          title="フォーム設定"
          description="Spreadsheet ID とフィールドマッピング、Webhook シークレットを編集。"
          label="Config"
        />
      </section>

      <section>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="font-dot text-lg tracking-[0.15em] text-paper">
            最近の取り込み
          </h2>
          <Link
            href="/admin/import"
            className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/60 transition-colors hover:text-neon"
          >
            view all →
          </Link>
        </header>

        {recentLogs.length === 0 ? (
          <div className="rounded-sm border border-dashed border-paper/15 bg-ink-soft/30 p-6 text-center font-handwritten text-paper/60">
            まだ取り込みログはありません。
          </div>
        ) : (
          <ul className="divide-y divide-paper/10 rounded-sm border border-paper/10 bg-ink-soft/30">
            {recentLogs.map((l) => (
              <li
                key={l.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <div className="font-typewriter text-[11px] uppercase tracking-[0.2em] text-paper/60">
                  {l.importedAt.toISOString().replace("T", " ").slice(0, 16)}
                </div>
                <div className="font-dot text-[11px] tracking-[0.15em] text-paper/80">
                  +{l.recordCount} / skip {l.skippedCount}
                </div>
                <StatusPill status={l.status} />
                <span className="hidden font-typewriter text-[10px] uppercase tracking-[0.25em] text-paper/40 sm:inline">
                  {l.trigger}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-sm border border-paper/10 bg-ink-soft/40 p-5">
      <div className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-paper/50">
        {label}
      </div>
      <div
        className={`mt-3 text-paper ${mono ? "font-typewriter text-sm" : "font-dot text-3xl tracking-[0.1em]"}`}
      >
        {value}
      </div>
      <div className="mt-1 font-handwritten text-sm text-paper/50">{hint}</div>
    </div>
  );
}

function AdminNavCard({
  href,
  title,
  description,
  label,
}: {
  href: string;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block rounded-sm border border-paper/15 bg-ink-soft/30 p-6 transition-colors hover:border-neon"
    >
      <div className="flex items-center justify-between">
        <div className="font-typewriter text-[10px] uppercase tracking-[0.3em] text-neon/80">
          {label}
        </div>
        <span className="font-typewriter text-[11px] uppercase tracking-[0.25em] text-paper/50 transition-colors group-hover:text-neon">
          enter →
        </span>
      </div>
      <h3 className="mt-3 font-dot text-xl tracking-[0.08em] text-paper group-hover:text-neon">
        {title}
      </h3>
      <p className="mt-2 font-handwritten text-paper/70">{description}</p>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "success"
      ? "bg-neon/20 text-neon"
      : status === "partial"
        ? "bg-rose/20 text-rose"
        : "bg-rouge/30 text-rouge";
  return (
    <span
      className={`rounded-sm px-2 py-0.5 font-dot text-[10px] tracking-[0.2em] ${tone}`}
    >
      {status}
    </span>
  );
}
