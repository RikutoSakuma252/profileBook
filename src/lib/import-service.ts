import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "@/lib/google-sheets";
import { transformRow } from "@/lib/profile-transformer";
import type { FieldMapping, ImportResult } from "@/types";

export type ImportTrigger = "manual" | "webhook";

export async function runImport(
  formConfigId: string,
  trigger: ImportTrigger
): Promise<ImportResult> {
  const config = await prisma.formConfig.findUnique({ where: { id: formConfigId } });
  if (!config) {
    throw new Error(`FormConfig not found: ${formConfigId}`);
  }

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  try {
    const { headers, dataRows } = await fetchSheetRows(
      config.spreadsheetId,
      config.sheetName
    );
    const mappings = config.fieldMappings as unknown as FieldMapping[];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      try {
        const result = transformRow(headers, row, mappings);
        if (!result.ok) {
          skipped++;
          continue;
        }
        const { profile } = result;

        const existing = await prisma.rawResponse.findUnique({
          where: { respondentId: profile.respondentId },
          select: { id: true },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const raw = await tx.rawResponse.create({
            data: {
              formConfigId,
              respondentId: profile.respondentId,
              responseData: profile.responseData,
              submittedAt: profile.submittedAt,
            },
          });
          await tx.profile.create({
            data: {
              rawResponseId: raw.id,
              displayName: profile.displayName,
              subtitle: profile.subtitle,
              avatarColor: profile.avatarColor,
              fields: {
                create: profile.fields.map((f) => ({
                  fieldKey: f.fieldKey,
                  label: f.label,
                  emoji: f.emoji,
                  value: f.value,
                  displayOrder: f.displayOrder,
                  isRequired: f.isRequired,
                })),
              },
            },
          });
        });
        imported++;
      } catch (e) {
        errors.push(`row ${i + 2}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  const status: "success" | "partial" | "failed" =
    errors.length === 0 ? "success" : imported > 0 ? "partial" : "failed";

  await prisma.importLog.create({
    data: {
      formConfigId,
      recordCount: imported,
      skippedCount: skipped,
      status,
      trigger,
      errorMessage: errors.length > 0 ? errors.join("\n").slice(0, 2000) : null,
    },
  });

  return { imported, skipped, errors };
}
