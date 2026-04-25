import { describe, it, expect } from "vitest";
import {
  pickAvatarColor,
  buildRespondentId,
  transformRow,
} from "@/lib/profile-transformer";
import type { FieldMapping } from "@/types";

// ---- pickAvatarColor ----

describe("pickAvatarColor", () => {
  it("同じ名前には常に同じ色を返す", () => {
    expect(pickAvatarColor("田中太郎")).toBe(pickAvatarColor("田中太郎"));
  });

  it("有効な hex カラーコードを返す", () => {
    const color = pickAvatarColor("テスト");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("空文字でもクラッシュしない", () => {
    expect(() => pickAvatarColor("")).not.toThrow();
  });

  it("名前が異なれば異なる色になりえる", () => {
    const colors = new Set(
      ["山田", "鈴木", "佐藤", "田中", "伊藤", "渡辺", "小林", "加藤", "吉田", "中村", "松本", "井上"].map(
        pickAvatarColor
      )
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});

// ---- buildRespondentId ----

describe("buildRespondentId", () => {
  it("同じ入力から常に同じ ID を生成する", () => {
    const id1 = buildRespondentId("2024-01-01 10:00:00", "user@example.com");
    const id2 = buildRespondentId("2024-01-01 10:00:00", "user@example.com");
    expect(id1).toBe(id2);
  });

  it("SHA256 の hex 文字列（64文字）を返す", () => {
    const id = buildRespondentId("2024-01-01", "test@example.com");
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("メールアドレスを小文字に正規化する", () => {
    const lower = buildRespondentId("2024-01-01", "User@Example.com");
    const normal = buildRespondentId("2024-01-01", "user@example.com");
    expect(lower).toBe(normal);
  });

  it("前後の空白をトリムして同じ ID を生成する", () => {
    const trimmed = buildRespondentId(" 2024-01-01 ", " user@example.com ");
    const normal = buildRespondentId("2024-01-01", "user@example.com");
    expect(trimmed).toBe(normal);
  });

  it("メールが異なれば異なる ID を返す", () => {
    const id1 = buildRespondentId("2024-01-01", "a@example.com");
    const id2 = buildRespondentId("2024-01-01", "b@example.com");
    expect(id1).not.toBe(id2);
  });

  it("タイムスタンプが異なれば異なる ID を返す", () => {
    const id1 = buildRespondentId("2024-01-01", "a@example.com");
    const id2 = buildRespondentId("2024-01-02", "a@example.com");
    expect(id1).not.toBe(id2);
  });
});

// ---- transformRow ----

const BASE_MAPPINGS: FieldMapping[] = [
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
  {
    columnHeader: "趣味",
    fieldKey: "hobby",
    label: "趣味",
    emoji: "🎮",
    displayOrder: 2,
    isRequired: false,
  },
];

const BASE_HEADERS = ["タイムスタンプ", "メールアドレス", "名前", "部署", "趣味"];

describe("transformRow", () => {
  it("有効なデータを正常に変換する", () => {
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "プログラミング",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.profile.displayName).toBe("山田太郎");
    expect(result.profile.subtitle).toBe("エンジニア部");
    expect(result.profile.avatarColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.profile.respondentId).toMatch(/^[0-9a-f]{64}$/);
    expect(result.profile.submittedAt).toBeInstanceOf(Date);
  });

  it("タイムスタンプがない場合は失敗する", () => {
    const headers = ["メールアドレス", "名前"];
    const row = ["yamada@example.com", "山田太郎"];
    const result = transformRow(headers, row, BASE_MAPPINGS);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing timestamp or email");
  });

  it("メールアドレスがない場合は失敗する", () => {
    const headers = ["タイムスタンプ", "名前"];
    const row = ["2024-01-15 10:30:00", "山田太郎"];
    const result = transformRow(headers, row, BASE_MAPPINGS);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing timestamp or email");
  });

  it("displayName が空の場合は失敗する", () => {
    const row = ["2024-01-15 10:30:00", "yamada@example.com", "", "エンジニア部", ""];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing displayName");
  });

  it("非必須フィールドが空の場合は fields に含まれない", () => {
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hobbyField = result.profile.fields.find((f) => f.fieldKey === "hobby");
    expect(hobbyField).toBeUndefined();
  });

  it("isRequired なフィールドは値が空でも fields に含まれる", () => {
    const mappingsWithRequiredHobby = BASE_MAPPINGS.map((m) =>
      m.fieldKey === "hobby" ? { ...m, isRequired: true } : m
    );
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "",
    ];
    const result = transformRow(BASE_HEADERS, row, mappingsWithRequiredHobby);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hobbyField = result.profile.fields.find((f) => f.fieldKey === "hobby");
    expect(hobbyField).toBeDefined();
    expect(hobbyField!.value).toBe("");
  });

  it("fields は displayOrder 順にソートされる", () => {
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "プログラミング",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const orders = result.profile.fields.map((f) => f.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("subtitle マッピングがない場合は null を返す", () => {
    const noSubtitleMappings = BASE_MAPPINGS.filter((m) => !m.isSubtitle);
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "プログラミング",
    ];
    const result = transformRow(BASE_HEADERS, row, noSubtitleMappings);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.subtitle).toBeNull();
  });

  it("subtitle の値が空文字の場合は null を返す", () => {
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "",
      "プログラミング",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.subtitle).toBeNull();
  });

  it("不正なタイムスタンプでも Date インスタンスを返す", () => {
    const row = [
      "invalid-date",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.submittedAt).toBeInstanceOf(Date);
    expect(isNaN(result.profile.submittedAt.getTime())).toBe(false);
  });

  it("English ヘッダー（Timestamp / Email）も認識する", () => {
    const englishHeaders = ["Timestamp", "Email", "名前", "部署", "趣味"];
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "プログラミング",
    ];
    const result = transformRow(englishHeaders, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
  });

  it("全ヘッダーのデータが responseData に含まれる", () => {
    const row = [
      "2024-01-15 10:30:00",
      "yamada@example.com",
      "山田太郎",
      "エンジニア部",
      "プログラミング",
    ];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.profile.responseData["タイムスタンプ"]).toBe("2024-01-15 10:30:00");
    expect(result.profile.responseData["名前"]).toBe("山田太郎");
    expect(result.profile.responseData["メールアドレス"]).toBe("yamada@example.com");
  });

  it("行データが headers より短い場合は空文字で補完される", () => {
    const row = ["2024-01-15 10:30:00", "yamada@example.com", "山田太郎"];
    const result = transformRow(BASE_HEADERS, row, BASE_MAPPINGS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.responseData["部署"]).toBe("");
    expect(result.profile.responseData["趣味"]).toBe("");
  });
});
