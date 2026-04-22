"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { runImport } from "@/lib/import-service";
import type { ImportResult } from "@/types";

export type ImportActionState =
  | { status: "idle" }
  | { status: "success"; result: ImportResult }
  | { status: "error"; message: string };

export async function runImportAction(
  _prev: ImportActionState,
  payload: { formConfigId: string }
): Promise<ImportActionState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { status: "error", message: "forbidden" };
  }

  if (!payload.formConfigId) {
    return { status: "error", message: "formConfigId is required" };
  }

  try {
    const result = await runImport(payload.formConfigId, "manual");
    revalidatePath("/admin/import");
    revalidatePath("/admin");
    revalidatePath("/profiles");
    revalidatePath("/");
    return { status: "success", result };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
