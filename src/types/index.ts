export interface FieldMapping {
  columnHeader: string;
  fieldKey: string;
  label: string;
  emoji: string;
  displayOrder: number;
  isRequired: boolean;
  isDisplayName?: boolean;
  isSubtitle?: boolean;
}

export interface ProfileFieldDto {
  id: string;
  fieldKey: string;
  label: string;
  emoji: string;
  value: string;
  displayOrder: number;
  isRequired: boolean;
}

export interface ProfileDto {
  id: string;
  displayName: string;
  subtitle: string | null;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
  fields?: ProfileFieldDto[];
}

export interface ProfilesResponse {
  profiles: ProfileDto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ImportLogDto {
  id: string;
  importedAt: string;
  recordCount: number;
  skippedCount: number;
  status: "success" | "partial" | "failed";
  trigger: "webhook" | "manual";
  errorMessage: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface FormConfigDto {
  id: string;
  spreadsheetId: string;
  sheetName: string;
  fieldMappings: FieldMapping[];
  webhookSecret: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "viewer";
