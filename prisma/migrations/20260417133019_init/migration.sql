-- CreateTable
CREATE TABLE "FormConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spreadsheetId" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL DEFAULT 'フォームの回答 1',
    "fieldMappings" JSONB NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RawResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formConfigId" TEXT NOT NULL,
    "responseData" JSONB NOT NULL,
    "submittedAt" DATETIME NOT NULL,
    "respondentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RawResponse_formConfigId_fkey" FOREIGN KEY ("formConfigId") REFERENCES "FormConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawResponseId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "subtitle" TEXT,
    "avatarColor" TEXT NOT NULL DEFAULT '#FF9AA2',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_rawResponseId_fkey" FOREIGN KEY ("rawResponseId") REFERENCES "RawResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '',
    "value" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileField_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formConfigId" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "errorMessage" TEXT,
    CONSTRAINT "ImportLog_formConfigId_fkey" FOREIGN KEY ("formConfigId") REFERENCES "FormConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RawResponse_respondentId_key" ON "RawResponse"("respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_rawResponseId_key" ON "Profile"("rawResponseId");

-- CreateIndex
CREATE INDEX "Profile_createdAt_idx" ON "Profile"("createdAt");

-- CreateIndex
CREATE INDEX "Profile_displayName_idx" ON "Profile"("displayName");

-- CreateIndex
CREATE INDEX "ProfileField_profileId_displayOrder_idx" ON "ProfileField"("profileId", "displayOrder");

-- CreateIndex
CREATE INDEX "ImportLog_importedAt_idx" ON "ImportLog"("importedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
