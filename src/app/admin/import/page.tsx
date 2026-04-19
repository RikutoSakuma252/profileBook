import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportRunner } from "./ImportRunner";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const [configs, logs] = await Promise.all([
    prisma.formConfig.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        spreadsheetId: true,
        sheetName: true,
        createdAt: true,
      },
    }),
    prisma.importLog.findMany({
      orderBy: { importedAt: "desc" },
      take: 30,
    }),
  ]);

  const configSummaries = configs.map((c) => ({
    id: c.id,
    label:
      c.spreadsheetId === "PLACEHOLDER_SPREADSHEET_ID"
        ? `${c.sheetName}（未設定）`
        : `${c.sheetName} · ${c.spreadsheetId.slice(0, 8)}…`,
    spreadsheetId: c.spreadsheetId,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 pt-12 pb-24">
      <div className="mb-6 flex items-center justify-between font-typewriter text-[11px] uppercase tracking-[0.3em]">
        <Link
          href="/admin"
          className="text-paper/60 transition-colors hover:text-neon"
        >
          ← Studio
        </Link>
        <span className="text-paper/30">Import Console</span>
      </div>

      <header className="mb-8 border-b border-paper/10 pb-6">
        <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-neon/80">
          Broadcast · Import
        </div>
        <h1 className="mt-2 font-dot text-3xl tracking-[0.08em] text-paper md:text-4xl">
          取り込み<span className="text-neon">管理</span>
        </h1>
        <p className="mt-2 font-handwritten text-paper/60">
          Google Sheets から最新の回答を取り込みます。
        </p>
      </header>

      <section className="mb-10">
        <ImportRunner configs={configSummaries} />
      </section>

      <section>
        <h2 className="mb-4 font-dot text-lg tracking-[0.15em] text-paper">
          取り込み履歴
        </h2>

        {logs.length === 0 ? (
          <div className="rounded-sm border border-dashed border-paper/15 bg-ink-soft/30 p-6 text-center font-handwritten text-paper/60">
            まだ取り込みログはありません。
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-paper/10">
            <table className="min-w-full divide-y divide-paper/10 text-left font-typewriter text-[11px] uppercase tracking-[0.2em] text-paper/80">
              <thead className="bg-ink-soft/50 text-paper/60">
                <tr>
                  <th className="px-4 py-3">日時</th>
                  <th className="px-4 py-3">追加</th>
                  <th className="px-4 py-3">スキップ</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3 hidden md:table-cell">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper/10 bg-ink-soft/20">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-paper/80">
                      {l.importedAt.toISOString().replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-4 py-3 font-dot text-neon">+{l.recordCount}</td>
                    <td className="px-4 py-3 text-paper/50">{l.skippedCount}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-paper/60">{l.trigger}</td>
                    <td className="px-4 py-3 text-rose/80 hidden md:table-cell max-w-sm truncate">
                      {l.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
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
