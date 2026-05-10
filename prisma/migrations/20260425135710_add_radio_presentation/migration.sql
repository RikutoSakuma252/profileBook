-- CreateTable
CREATE TABLE "RadioPresentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL,
    "imageKeywords" TEXT NOT NULL,
    "generatedHtml" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RadioPresentation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RadioPresentation_profileId_createdAt_idx" ON "RadioPresentation"("profileId", "createdAt");
