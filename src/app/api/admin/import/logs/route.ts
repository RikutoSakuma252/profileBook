import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ImportLogDto } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parseInt(value: string | null, fallback: number, max?: number) {
  const n = value ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return max ? Math.min(Math.floor(n), max) : Math.floor(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page"), 1);
  const limit = parseInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);

  const [total, rows] = await Promise.all([
    prisma.importLog.count(),
    prisma.importLog.findMany({
      orderBy: { importedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const logs: ImportLogDto[] = rows.map((r) => ({
    id: r.id,
    importedAt: r.importedAt.toISOString(),
    recordCount: r.recordCount,
    skippedCount: r.skippedCount,
    status: r.status as ImportLogDto["status"],
    trigger: r.trigger as ImportLogDto["trigger"],
    errorMessage: r.errorMessage,
  }));

  return NextResponse.json({ logs, total });
}
