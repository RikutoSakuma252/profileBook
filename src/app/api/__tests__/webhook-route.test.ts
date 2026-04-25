import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    formConfig: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/import-service", () => ({
  runImport: vi.fn(),
}));

import { POST } from "@/app/api/webhook/form-submit/route";
import { prisma } from "@/lib/prisma";
import { runImport } from "@/lib/import-service";

const MOCK_CONFIG = {
  id: "config-1",
  spreadsheetId: "sheet-id",
  webhookSecret: "valid-secret",
};

function makeRequest(
  secret: string | null,
  body?: unknown
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers["x-webhook-secret"] = secret;
  return new Request("http://localhost/api/webhook/form-submit", {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : "{}",
  });
}

describe("POST /api/webhook/form-submit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("x-webhook-secret ヘッダーがない場合は 401", async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("シークレットが一致する config がない場合は 401", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("有効なシークレットで runImport が呼ばれ 200 を返す", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    vi.mocked(runImport).mockResolvedValue({ imported: 3, skipped: 1, errors: [] });

    const res = await POST(makeRequest("valid-secret", { spreadsheetId: "sheet-id" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ imported: 3, skipped: 1 });
    expect(runImport).toHaveBeenCalledWith("config-1", "webhook");
  });

  it("spreadsheetId をフィルタとして findMany に渡す", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    vi.mocked(runImport).mockResolvedValue({ imported: 0, skipped: 0, errors: [] });

    await POST(makeRequest("valid-secret", { spreadsheetId: "sheet-id" }));

    expect(prisma.formConfig.findMany).toHaveBeenCalledWith({
      where: { spreadsheetId: "sheet-id" },
    });
  });

  it("spreadsheetId がない場合は where なしで findMany を呼ぶ", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    vi.mocked(runImport).mockResolvedValue({ imported: 0, skipped: 0, errors: [] });

    await POST(makeRequest("valid-secret", {}));

    expect(prisma.formConfig.findMany).toHaveBeenCalledWith({ where: undefined });
  });

  it("runImport がエラーをスローした場合は 500", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    vi.mocked(runImport).mockRejectedValue(new Error("DB connection failed"));

    const res = await POST(makeRequest("valid-secret"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB connection failed");
  });

  it("JSON parse エラーでも body を {} として処理し runImport を呼ぶ", async () => {
    vi.mocked(prisma.formConfig.findMany).mockResolvedValue([MOCK_CONFIG] as never);
    vi.mocked(runImport).mockResolvedValue({ imported: 0, skipped: 0, errors: [] });

    const req = new Request("http://localhost/api/webhook/form-submit", {
      method: "POST",
      headers: { "x-webhook-secret": "valid-secret", "content-type": "application/json" },
      body: "invalid-json",
    });

    const res = await POST(req);
    // body={} で spreadsheetId フィルタなし → secret が一致 → 200
    expect(res.status).toBe(200);
    expect(prisma.formConfig.findMany).toHaveBeenCalledWith({ where: undefined });
  });
});
