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
    importLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/admin/import/logs/route";
import { prisma } from "@/lib/prisma";

const MOCK_LOG = {
  id: "log-1",
  importedAt: new Date("2024-01-15T10:00:00Z"),
  recordCount: 5,
  skippedCount: 1,
  status: "success",
  trigger: "manual",
  errorMessage: null,
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/admin/import/logs");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/admin/import/logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.importLog.count).mockResolvedValue(0);
    vi.mocked(prisma.importLog.findMany).mockResolvedValue([]);
  });

  it("デフォルトで skip=0, take=20", async () => {
    await GET(makeRequest());

    expect(prisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    );
  });

  it("limit が MAX_LIMIT(100) を超えた場合は 100 にキャップ", async () => {
    await GET(makeRequest({ limit: "200" }));

    expect(prisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it("page=3, limit=10 → skip=20", async () => {
    await GET(makeRequest({ page: "3", limit: "10" }));

    expect(prisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });

  it("常に importedAt desc で並び替える", async () => {
    await GET(makeRequest());

    expect(prisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { importedAt: "desc" } })
    );
  });

  it("レスポンスに logs と total が含まれる", async () => {
    vi.mocked(prisma.importLog.count).mockResolvedValue(42);
    vi.mocked(prisma.importLog.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body).toHaveProperty("logs");
    expect(body).toHaveProperty("total", 42);
  });

  it("ImportLogDto の型変換が正しく行われる", async () => {
    vi.mocked(prisma.importLog.count).mockResolvedValue(1);
    vi.mocked(prisma.importLog.findMany).mockResolvedValue([MOCK_LOG] as never);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.logs).toHaveLength(1);
    expect(body.logs[0]).toEqual({
      id: "log-1",
      importedAt: "2024-01-15T10:00:00.000Z",
      recordCount: 5,
      skippedCount: 1,
      status: "success",
      trigger: "manual",
      errorMessage: null,
    });
  });

  it("errorMessage がある場合も正しく返す", async () => {
    const logWithError = { ...MOCK_LOG, status: "failed", errorMessage: "行 2: 変換エラー" };
    vi.mocked(prisma.importLog.findMany).mockResolvedValue([logWithError] as never);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.logs[0].errorMessage).toBe("行 2: 変換エラー");
    expect(body.logs[0].status).toBe("failed");
  });

  it("非数値の page パラメータは 1 にフォールバック", async () => {
    await GET(makeRequest({ page: "abc" }));

    expect(prisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });
});
