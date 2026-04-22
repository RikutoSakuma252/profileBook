"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { FieldMapping, FormConfigDto } from "@/types";

export type SaveConfigState =
  | { status: "idle" }
  | { status: "success"; config: FormConfigDto; mode: "create" | "edit" }
  | { status: "error"; message: string };

interface SaveConfigPayload {
  id: string | null;
  spreadsheetId: string;
  sheetName: string;
  fieldMappings: FieldMapping[];
  regenerateSecret?: boolean;
}

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

export async function saveConfigAction(
  _prev: SaveConfigState,
  payload: SaveConfigPayload
): Promise<SaveConfigState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { status: "error", message: "forbidden" };
  }

  if (!payload.spreadsheetId) {
    return { status: "error", message: "spreadsheetId is required" };
  }
  if (!Array.isArray(payload.fieldMappings)) {
    return { status: "error", message: "fieldMappings must be an array" };
  }

  try {
    if (!payload.id) {
      const created = await prisma.formConfig.create({
        data: {
          spreadsheetId: payload.spreadsheetId,
          sheetName: payload.sheetName || "フォームの回答 1",
          fieldMappings: payload.fieldMappings as unknown as object,
          webhookSecret: crypto.randomBytes(32).toString("hex"),
        },
      });
      revalidatePath("/admin");
      revalidatePath("/admin/config");
      revalidatePath("/admin/import");
      return { status: "success", mode: "create", config: toDto(created) };
    }

    const data: {
      spreadsheetId?: string;
      sheetName?: string;
      fieldMappings?: object;
      webhookSecret?: string;
    } = {
      spreadsheetId: payload.spreadsheetId,
      sheetName: payload.sheetName,
      fieldMappings: payload.fieldMappings as unknown as object,
    };
    if (payload.regenerateSecret) {
      data.webhookSecret = crypto.randomBytes(32).toString("hex");
    }

    const updated = await prisma.formConfig.update({
      where: { id: payload.id },
      data,
    });
    revalidatePath("/admin");
    revalidatePath("/admin/config");
    revalidatePath("/admin/import");
    return { status: "success", mode: "edit", config: toDto(updated) };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
