import crypto from "crypto";
import type { FieldMapping } from "@/types";

const AVATAR_PALETTE = [
  "#FF9AA2",
  "#FFB7B2",
  "#FFDAC1",
  "#E2F0CB",
  "#B5EAD7",
  "#C7CEEA",
  "#FFD3B6",
  "#FFAAA5",
  "#D4A5A5",
  "#A8E6CF",
  "#F3C677",
  "#C4B8E2",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function pickAvatarColor(displayName: string): string {
  return AVATAR_PALETTE[hashString(displayName) % AVATAR_PALETTE.length];
}

export function buildRespondentId(timestamp: string, email: string): string {
  return crypto
    .createHash("sha256")
    .update(`${timestamp.trim()}|${email.trim().toLowerCase()}`)
    .digest("hex");
}

const TIMESTAMP_HEADERS = ["タイムスタンプ", "Timestamp"];
const EMAIL_HEADERS = ["メールアドレス", "Email", "Email Address", "メール アドレス"];

function pick(record: Record<string, string>, candidates: string[]): string {
  for (const key of candidates) {
    if (record[key] != null && record[key] !== "") return record[key];
  }
  return "";
}

export type TransformedProfile = {
  respondentId: string;
  submittedAt: Date;
  responseData: Record<string, string>;
  displayName: string;
  subtitle: string | null;
  avatarColor: string;
  fields: Array<{
    fieldKey: string;
    label: string;
    emoji: string;
    value: string;
    displayOrder: number;
    isRequired: boolean;
  }>;
};

export type TransformResult =
  | { ok: true; profile: TransformedProfile }
  | { ok: false; reason: string };

export function transformRow(
  headers: string[],
  row: string[],
  fieldMappings: FieldMapping[]
): TransformResult {
  const record: Record<string, string> = {};
  headers.forEach((h, i) => {
    record[h] = (row[i] ?? "").toString();
  });

  const timestamp = pick(record, TIMESTAMP_HEADERS);
  const email = pick(record, EMAIL_HEADERS);
  if (!timestamp || !email) {
    return { ok: false, reason: "missing timestamp or email" };
  }

  const displayNameMapping = fieldMappings.find((m) => m.isDisplayName);
  const subtitleMapping = fieldMappings.find((m) => m.isSubtitle);
  const displayName = displayNameMapping
    ? (record[displayNameMapping.columnHeader] ?? "").trim()
    : "";
  if (!displayName) {
    return { ok: false, reason: "missing displayName" };
  }
  const subtitle = subtitleMapping
    ? (record[subtitleMapping.columnHeader] ?? "").trim() || null
    : null;

  const fields = fieldMappings
    .map((m) => ({
      fieldKey: m.fieldKey,
      label: m.label,
      emoji: m.emoji,
      value: (record[m.columnHeader] ?? "").trim(),
      displayOrder: m.displayOrder,
      isRequired: m.isRequired,
    }))
    .filter((f) => f.isRequired || f.value.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const submittedAt = new Date(timestamp);
  const safeSubmittedAt = isNaN(submittedAt.getTime()) ? new Date() : submittedAt;

  return {
    ok: true,
    profile: {
      respondentId: buildRespondentId(timestamp, email),
      submittedAt: safeSubmittedAt,
      responseData: record,
      displayName,
      subtitle,
      avatarColor: pickAvatarColor(displayName),
      fields,
    },
  };
}
