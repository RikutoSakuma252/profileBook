import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import type { FieldMapping, FormConfigDto } from "@/types";

function toDto(c: {
  id: string;
  spreadsheetId: string;
  sheetName: string;
  fieldMappings: unknown;
  webhookSecret: string;
  createdAt: Date;
  updatedAt: Date;
}): FormConfigDto {
  return {
    id: c.id,
    spreadsheetId: c.spreadsheetId,
    sheetName: c.sheetName,
    fieldMappings: c.fieldMappings as FieldMapping[],
    webhookSecret: c.webhookSecret,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET() {
  const rows = await prisma.formConfig.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ configs: rows.map(toDto) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    spreadsheetId?: string;
    sheetName?: string;
    fieldMappings?: FieldMapping[];
  } | null;

  if (!body?.spreadsheetId || !Array.isArray(body.fieldMappings)) {
    return NextResponse.json(
      { error: "spreadsheetId and fieldMappings are required" },
      { status: 400 }
    );
  }

  const config = await prisma.formConfig.create({
    data: {
      spreadsheetId: body.spreadsheetId,
      sheetName: body.sheetName ?? "フォームの回答 1",
      fieldMappings: body.fieldMappings as unknown as object,
      webhookSecret: crypto.randomBytes(32).toString("hex"),
    },
  });

  return NextResponse.json({ config: toDto(config) }, { status: 201 });
}
