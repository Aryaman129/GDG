/*
  Warnings:

  - Added the required column `password` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT
);
INSERT INTO "new_profiles" ("created_at", "email", "full_name", "id", "otp_verified", "role", "password")
SELECT "created_at", "email", "full_name", "id", "otp_verified", "role", '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm' FROM "profiles";
-- Default password is 'password123' hashed with bcrypt
DROP TABLE "profiles";
ALTER TABLE "new_profiles" RENAME TO "profiles";
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
