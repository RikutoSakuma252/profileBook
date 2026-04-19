import { NextResponse } from "next/server";
import { runImport } from "@/lib/import-service";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { formConfigId?: string };
  if (!body.formConfigId) {
    return NextResponse.json(
      { error: "formConfigId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await runImport(body.formConfigId, "manual");
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
