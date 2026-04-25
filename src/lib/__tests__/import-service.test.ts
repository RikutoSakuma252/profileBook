import { describe, it, expect, vi, beforeEach } from "vitest";

// モックは import より先にホイスティングされる
vi.mock("@/lib/prisma", () => ({
  prisma: {
    formConfig: { findUnique: vi.fn() },
    rawResponse: { findUnique: vi.fn() },
    importLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/google-sheets", () => ({
  fetchSheetRows: vi.fn(),
}));

import { runImport } from "@/lib/import-service";
import { prisma } from "@/lib/prisma";
import { fetchSheetRows } from "@/lib/google-sheets";
import type { FieldMapping } from "@/types";

// ---- ヘルパー ----

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    columnHeader: "名前",
    fieldKey: "name",
    label: "名前",
    emoji: "👤",
    displayOrder: 0,
    isRequired: true,
    isDisplayName: true,
  },
  {
    columnHeader: "部署",
    fieldKey: "department",
    label: "部署",
    emoji: "🏢",
    displayOrder: 1,
    isRequired: false,
    isSubtitle: true,
  },
];

const MOCK_FORM_CONFIG = {
  id: "config-1",
  spreadsheetId: "sheet-id",
  sheetName: "Sheet1",
  fieldMappings: FIELD_MAPPINGS as unknown as import("@prisma/client").Prisma.JsonValue,
  webhookSecret: "secret",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const SHEET_HEADERS = ["タイムスタンプ", "メールアドレス", "名前", "部署"];
const VALID_ROW = ["2024-01-15 10:30:00", "yamada@example.com", "山田太郎", "エンジニア部"];

function setupTransaction(rawId = "raw-id-1") {
  vi.mocked(prisma.$transaction).mockImplementation(async (cb: unknown) => {
    return (cb as (tx: unknown) => Promise<unknown>)({
      rawResponse: { create: vi.fn().mockResolvedValue({ id: rawId }) },
      profile: { create: vi.fn().mockResolvedValue({}) },
    });
  });
}

// ---- テスト ----

describe("runImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.importLog.create).mockResolvedValue({} as never);
  });

  it("FormConfig が存在しない場合はエラーをスロー", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(null);

    await expect(runImport("missing-id", "manual")).rejects.toThrow(
      "FormConfig not found: missing-id"
    );
  });

  it("正常インポート: imported=1, skipped=0, errors=[]", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({
      headers: SHEET_HEADERS,
      dataRows: [VALID_ROW],
    });
    vi.mocked(prisma.rawResponse.findUnique).mockResolvedValue(null);
    setupTransaction();

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("既存の respondentId はスキップされる", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({
      headers: SHEET_HEADERS,
      dataRows: [VALID_ROW],
    });
    vi.mocked(prisma.rawResponse.findUnique).mockResolvedValue({ id: "existing" } as never);

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("transformRow が失敗した行はスキップされる", async () => {
    const invalidRow = ["", "", "", ""];
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({
      headers: SHEET_HEADERS,
      dataRows: [invalidRow],
    });

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it("Google Sheets API エラー → errors に記録され status=failed", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockRejectedValue(new Error("Sheets API unreachable"));

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Sheets API unreachable");

    expect(vi.mocked(prisma.importLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    );
  });

  it("一部成功・一部スキップ → status=success で ImportLog を保存", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({
      headers: SHEET_HEADERS,
      dataRows: [VALID_ROW, VALID_ROW],
    });
    vi.mocked(prisma.rawResponse.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing" } as never);
    setupTransaction();

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);

    expect(vi.mocked(prisma.importLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "success" }) })
    );
  });

  it("trigger が ImportLog に正しく保存される", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({ headers: SHEET_HEADERS, dataRows: [] });

    await runImport("config-1", "webhook");

    expect(vi.mocked(prisma.importLog.create)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ trigger: "webhook", formConfigId: "config-1" }),
      })
    );
  });

  it("データが 0 件でも ImportLog は保存される", async () => {
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({ headers: SHEET_HEADERS, dataRows: [] });

    const result = await runImport("config-1", "manual");

    expect(result.imported).toBe(0);
    expect(prisma.importLog.create).toHaveBeenCalledOnce();
  });

  it("errorMessage は 2000 文字に切り詰められる", async () => {
    const longMessage = "x".repeat(3000);
    vi.mocked(prisma.formConfig.findUnique).mockResolvedValue(MOCK_FORM_CONFIG);
    vi.mocked(fetchSheetRows).mockResolvedValue({
      headers: SHEET_HEADERS,
      dataRows: [VALID_ROW],
    });
    vi.mocked(prisma.rawResponse.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error(longMessage));

    await runImport("config-1", "manual");

    const call = vi.mocked(prisma.importLog.create).mock.calls[0][0];
    expect(call.data.errorMessage!.length).toBeLessThanOrEqual(2000);
  });
});
