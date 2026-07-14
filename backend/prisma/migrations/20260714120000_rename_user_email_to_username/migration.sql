-- Rename the User login identifier from `email` to `username`. Existing values
-- are preserved: a stored e-mail simply becomes that account's username.

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
