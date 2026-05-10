import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    formConfig: {
      create: vi.fn(),
      update: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
    rawResponse: {
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/import-service", () => ({ runImport: vi.fn() }));

import { saveConfigAction } from "@/app/admin/config/actions";
import { deleteProfileAction } from "@/app/profiles/[id]/actions";
import { runImportAction } from "@/app/admin/import/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runImport } from "@/lib/import-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FieldMapping } from "@/types";

const ADMIN_SESSION = { user: { id: "u1", email: "admin@e.com", role: "admin" } };
const VIEWER_SESSION = { user: { id: "u2", email: "viewer@e.com", role: "viewer" } };
const IDLE = { status: "idle" } as const;

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
];

const MOCK_FORM_CONFIG = {
  id: "cfg-1",
  spreadsheetId: "sid",
  sheetName: "Sheet1",
  fieldMappings: FIELD_MAPPINGS,
  webhookSecret: "secret-hex",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

// ============================================================
// saveConfigAction
// ============================================================

describe("saveConfigAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("admin 以外は error: forbidden を返す", async () => {
    vi.mocked(auth).mockResolvedValue(VIEWER_SESSION as never);
    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });
    expect(result).toEqual({ status: "error", message: "forbidden" });
  });

  it("未ログインは error: forbidden を返す", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });
    expect(result).toEqual({ status: "error", message: "forbidden" });
  });

  it("spreadsheetId が空なら error を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });
    expect(result).toEqual({ status: "error", message: "spreadsheetId is required" });
  });

  it("fieldMappings が配列でなければ error を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: "invalid" as unknown as FieldMapping[],
    });
    expect(result).toEqual({ status: "error", message: "fieldMappings must be an array" });
  });

  it("id=null → create モードで success を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.create).mockResolvedValue(MOCK_FORM_CONFIG as never);

    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.mode).toBe("create");
    expect(result.config.id).toBe("cfg-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("create 時に sheetName が空なら デフォルト値 'フォームの回答 1' を使う", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.create).mockResolvedValue(MOCK_FORM_CONFIG as never);

    await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "",
      fieldMappings: FIELD_MAPPINGS,
    });

    expect(prisma.formConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sheetName: "フォームの回答 1" }),
      })
    );
  });

  it("id あり → update モードで success を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.update).mockResolvedValue(MOCK_FORM_CONFIG as never);

    const result = await saveConfigAction(IDLE, {
      id: "cfg-1",
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.mode).toBe("edit");
    expect(prisma.formConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cfg-1" } })
    );
  });

  it("regenerateSecret=true → webhookSecret が data に含まれる", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.update).mockResolvedValue(MOCK_FORM_CONFIG as never);

    await saveConfigAction(IDLE, {
      id: "cfg-1",
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
      regenerateSecret: true,
    });

    const callData = vi.mocked(prisma.formConfig.update).mock.calls[0][0].data;
    expect(callData).toHaveProperty("webhookSecret");
    expect(typeof callData.webhookSecret).toBe("string");
    expect((callData.webhookSecret as string).length).toBeGreaterThan(0);
  });

  it("regenerateSecret=false → webhookSecret は data に含まれない", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.update).mockResolvedValue(MOCK_FORM_CONFIG as never);

    await saveConfigAction(IDLE, {
      id: "cfg-1",
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
      regenerateSecret: false,
    });

    const callData = vi.mocked(prisma.formConfig.update).mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("webhookSecret");
  });

  it("DB エラー → error state を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.formConfig.create).mockRejectedValue(new Error("DB connection lost"));

    const result = await saveConfigAction(IDLE, {
      id: null,
      spreadsheetId: "sid",
      sheetName: "Sheet1",
      fieldMappings: FIELD_MAPPINGS,
    });

    expect(result).toEqual({ status: "error", message: "DB connection lost" });
  });
});

// ============================================================
// deleteProfileAction
// ============================================================

describe("deleteProfileAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("admin 以外は error: forbidden を返す", async () => {
    vi.mocked(auth).mockResolvedValue(VIEWER_SESSION as never);
    const result = await deleteProfileAction(IDLE, { id: "p1" });
    expect(result).toEqual({ status: "error", message: "forbidden" });
  });

  it("プロフィールが存在しない場合は error: not_found を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);

    const result = await deleteProfileAction(IDLE, { id: "p1" });
    expect(result).toEqual({ status: "error", message: "not_found" });
  });

  it("削除成功 → redirect('/profiles') が呼ばれる", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      rawResponseId: "raw-1",
    } as never);
    vi.mocked(prisma.rawResponse.delete).mockResolvedValue({} as never);

    await deleteProfileAction(IDLE, { id: "p1" });

    expect(prisma.rawResponse.delete).toHaveBeenCalledWith({ where: { id: "raw-1" } });
    expect(revalidatePath).toHaveBeenCalledWith("/profiles");
    expect(redirect).toHaveBeenCalledWith("/profiles");
  });

  it("削除 DB エラー → error state を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      rawResponseId: "raw-1",
    } as never);
    vi.mocked(prisma.rawResponse.delete).mockRejectedValue(new Error("FK constraint"));

    const result = await deleteProfileAction(IDLE, { id: "p1" });
    expect(result).toEqual({ status: "error", message: "FK constraint" });
  });
});

// ============================================================
// runImportAction
// ============================================================

describe("runImportAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("admin 以外は error: forbidden を返す", async () => {
    vi.mocked(auth).mockResolvedValue(VIEWER_SESSION as never);
    const result = await runImportAction(IDLE, { formConfigId: "cfg-1" });
    expect(result).toEqual({ status: "error", message: "forbidden" });
  });

  it("formConfigId が空なら error を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    const result = await runImportAction(IDLE, { formConfigId: "" });
    expect(result).toEqual({ status: "error", message: "formConfigId is required" });
  });

  it("runImport 成功 → success state と revalidatePath を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(runImport).mockResolvedValue({ imported: 5, skipped: 1, errors: [] });

    const result = await runImportAction(IDLE, { formConfigId: "cfg-1" });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.result).toEqual({ imported: 5, skipped: 1, errors: [] });
    expect(runImport).toHaveBeenCalledWith("cfg-1", "manual");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/import");
  });

  it("runImport エラー → error state を返す", async () => {
    vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as never);
    vi.mocked(runImport).mockRejectedValue(new Error("FormConfig not found: cfg-1"));

    const result = await runImportAction(IDLE, { formConfigId: "cfg-1" });
    expect(result).toEqual({ status: "error", message: "FormConfig not found: cfg-1" });
  });
});
