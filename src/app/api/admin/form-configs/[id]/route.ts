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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    spreadsheetId?: string;
    sheetName?: string;
    fieldMappings?: FieldMapping[];
    regenerateSecret?: boolean;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const data: {
    spreadsheetId?: string;
    sheetName?: string;
    fieldMappings?: object;
    webhookSecret?: string;
  } = {};
  if (typeof body.spreadsheetId === "string") data.spreadsheetId = body.spreadsheetId;
  if (typeof body.sheetName === "string") data.sheetName = body.sheetName;
  if (Array.isArray(body.fieldMappings)) {
    data.fieldMappings = body.fieldMappings as unknown as object;
  }
  if (body.regenerateSecret) {
    data.webhookSecret = crypto.randomBytes(32).toString("hex");
  }

  try {
    const updated = await prisma.formConfig.update({ where: { id }, data });
    return NextResponse.json({ config: toDto(updated) });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
