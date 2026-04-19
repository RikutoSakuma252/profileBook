import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ConfigEditor } from "./ConfigEditor";
import type { FieldMapping, FormConfigDto } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const configs = await prisma.formConfig.findMany({
    orderBy: { createdAt: "asc" },
  });

  const dtos: FormConfigDto[] = configs.map((c) => ({
    id: c.id,
    spreadsheetId: c.spreadsheetId,
    sheetName: c.sheetName,
    fieldMappings: c.fieldMappings as unknown as FieldMapping[],
    webhookSecret: c.webhookSecret,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
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
        <span className="text-paper/30">Form Config</span>
      </div>

      <header className="mb-8 border-b border-paper/10 pb-6">
        <div className="font-typewriter text-[11px] uppercase tracking-[0.35em] text-neon/80">
          Frequency · Wiring
        </div>
        <h1 className="mt-2 font-dot text-3xl tracking-[0.08em] text-paper md:text-4xl">
          フォーム<span className="text-neon">設定</span>
        </h1>
        <p className="mt-2 font-handwritten text-paper/60">
          Google Spreadsheet の列とプロフィール項目の対応を編集します。
        </p>
      </header>

      <ConfigEditor initialConfigs={dtos} />
    </main>
  );
}
