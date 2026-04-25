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

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/profiles/route";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MOCK_SESSION = { user: { id: "user-1", email: "user@example.com", role: "viewer" } };

const MOCK_PROFILE = {
  id: "profile-1",
  displayName: "山田太郎",
  subtitle: "エンジニア部",
  avatarColor: "#FF9AA2",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
};

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/profiles");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe("GET /api/profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(MOCK_SESSION as never);
    vi.mocked(prisma.profile.count).mockResolvedValue(0);
    vi.mocked(prisma.profile.findMany).mockResolvedValue([]);
  });

  it("セッションがない場合は 401", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("unauthorized");
  });

  it("デフォルトで page=1, limit=20, newest ソート", async () => {
    await GET(makeRequest());

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("search パラメータが where の OR 条件に変換される", async () => {
    await GET(makeRequest({ search: "山田" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { displayName: { contains: "山田" } },
            { subtitle: { contains: "山田" } },
          ],
        },
      })
    );
  });

  it("search が空の場合は where なし", async () => {
    await GET(makeRequest({ search: "" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("sort=oldest → createdAt asc", async () => {
    await GET(makeRequest({ sort: "oldest" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    );
  });

  it("sort=name → displayName asc", async () => {
    await GET(makeRequest({ sort: "name" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { displayName: "asc" } })
    );
  });

  it("不正な sort 値は newest (createdAt desc) にフォールバック", async () => {
    await GET(makeRequest({ sort: "invalid" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("limit が MAX_LIMIT(60) を超えた場合は 60 にキャップ", async () => {
    await GET(makeRequest({ limit: "100" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 60 })
    );
  });

  it("page < 1 の場合は 1 にフォールバック", async () => {
    await GET(makeRequest({ page: "0" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it("非数値の page は 1 にフォールバック", async () => {
    await GET(makeRequest({ page: "abc" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it("page=2, limit=10 → skip=10", async () => {
    await GET(makeRequest({ page: "2", limit: "10" }));

    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it("total=0 のとき totalPages は 1", async () => {
    vi.mocked(prisma.profile.count).mockResolvedValue(0);
    vi.mocked(prisma.profile.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.totalPages).toBe(1);
  });

  it("total=21, limit=20 → totalPages=2", async () => {
    vi.mocked(prisma.profile.count).mockResolvedValue(21);
    vi.mocked(prisma.profile.findMany).mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.totalPages).toBe(2);
  });

  it("レスポンスが正しい ProfileDto 構造を返す", async () => {
    vi.mocked(prisma.profile.count).mockResolvedValue(1);
    vi.mocked(prisma.profile.findMany).mockResolvedValue([MOCK_PROFILE] as never);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.profiles).toHaveLength(1);
    expect(body.profiles[0]).toEqual({
      id: "profile-1",
      displayName: "山田太郎",
      subtitle: "エンジニア部",
      avatarColor: "#FF9AA2",
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
    });
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
  });
});
