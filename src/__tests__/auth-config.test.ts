import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn(() => ({ id: "google", type: "oauth" })),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: vi.fn((url: URL) => ({ _type: "redirect", url: url.toString() })),
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      _type: "json",
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// authorized コールバックを直接呼び出せる形に取り出す
const authorized = authConfig.callbacks!.authorized!;

function makeReq(pathname: string) {
  return { nextUrl: new URL(`http://localhost${pathname}`) } as Parameters<typeof authorized>[0]["request"];
}

type MockSession = { user: { role?: string; id?: string } } | null;

function call(session: MockSession, pathname: string) {
  return (authorized as Function)({ auth: session, request: makeReq(pathname) });
}

describe("authorized callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // /admin パス
  describe("/admin/*", () => {
    it("未ログインは false を返す", () => {
      expect(call(null, "/admin")).toBe(false);
    });

    it("viewer ロールは /?forbidden=1 へリダイレクト", () => {
      const result = call({ user: { role: "viewer" } }, "/admin");
      expect(NextResponse.redirect).toHaveBeenCalledOnce();
      const redirectUrl: string = vi.mocked(NextResponse.redirect).mock.calls[0][0].toString();
      expect(redirectUrl).toContain("forbidden=1");
    });

    it("admin ロールは true を返す", () => {
      expect(call({ user: { role: "admin" } }, "/admin")).toBe(true);
    });

    it("/admin/config でも同じルールが適用される", () => {
      expect(call(null, "/admin/config")).toBe(false);
      expect(call({ user: { role: "admin" } }, "/admin/config")).toBe(true);
    });
  });

  // /api/admin パス
  describe("/api/admin/*", () => {
    it("未ログインは 403 JSON を返す", () => {
      const result = call(null, "/api/admin/import") as { status: number };
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "forbidden" },
        { status: 403 }
      );
    });

    it("viewer ロールは 403 JSON を返す", () => {
      call({ user: { role: "viewer" } }, "/api/admin/import");
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "forbidden" },
        { status: 403 }
      );
    });

    it("admin ロールは true を返す", () => {
      expect(call({ user: { role: "admin" } }, "/api/admin/import")).toBe(true);
    });
  });

  // /profiles パス
  describe("/profiles/*", () => {
    it("未ログインは false を返す", () => {
      expect(call(null, "/profiles")).toBe(false);
    });

    it("ログイン済みは true を返す", () => {
      expect(call({ user: { role: "viewer" } }, "/profiles")).toBe(true);
    });

    it("/profiles/123 でも同じルールが適用される", () => {
      expect(call(null, "/profiles/abc-123")).toBe(false);
      expect(call({ user: {} }, "/profiles/abc-123")).toBe(true);
    });
  });

  // その他のパス
  describe("その他のパス", () => {
    it("/ は常に true を返す", () => {
      expect(call(null, "/")).toBe(true);
    });

    it("/login は常に true を返す", () => {
      expect(call(null, "/login")).toBe(true);
    });
  });

  // session コールバック
  describe("session callback", () => {
    const session = authConfig.callbacks!.session!;

    it("token の id と role を session.user に書き込む", async () => {
      const mockSession = {
        user: { id: "old", email: "u@example.com" },
        expires: "2099-01-01",
      } as Parameters<typeof session>[0]["session"];
      const token = { id: "new-id", role: "admin", email: "u@example.com" } as any;

      const result = await (session as Function)({ session: mockSession, token });
      expect(result.user.id).toBe("new-id");
      expect(result.user.role).toBe("admin");
    });

    it("token がない場合は session をそのまま返す", async () => {
      const mockSession = {
        user: { id: "orig", email: "u@example.com" },
        expires: "2099-01-01",
      } as Parameters<typeof session>[0]["session"];

      const result = await (session as Function)({ session: mockSession, token: null });
      expect(result.user.id).toBe("orig");
    });
  });
});
