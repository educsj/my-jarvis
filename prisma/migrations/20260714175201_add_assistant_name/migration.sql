-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assistantName" TEXT NOT NULL DEFAULT 'Meu Assistente',
    "humorLevel" INTEGER NOT NULL DEFAULT 50,
    "empathyLevel" INTEGER NOT NULL DEFAULT 50,
    "cautionLevel" INTEGER NOT NULL DEFAULT 50,
    "objectivityLevel" INTEGER NOT NULL DEFAULT 50,
    "formalityLevel" INTEGER NOT NULL DEFAULT 50,
    "proactivityLevel" INTEGER NOT NULL DEFAULT 50,
    "llmModel" TEXT NOT NULL DEFAULT 'llama3.1:8b',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("cautionLevel", "createdAt", "empathyLevel", "formalityLevel", "humorLevel", "id", "llmModel", "objectivityLevel", "proactivityLevel", "updatedAt", "userId") SELECT "cautionLevel", "createdAt", "empathyLevel", "formalityLevel", "humorLevel", "id", "llmModel", "objectivityLevel", "proactivityLevel", "updatedAt", "userId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
