import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runImport } from "@/lib/import-service";

export async function POST(req: Request) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { spreadsheetId?: string };

  const configs = await prisma.formConfig.findMany({
    where: body.spreadsheetId ? { spreadsheetId: body.spreadsheetId } : undefined,
  });
  const target = configs.find((c) => c.webhookSecret === secret);
  if (!target) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runImport(target.id, "webhook");
    return NextResponse.json({
      imported: result.imported,
      skipped: result.skipped,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
