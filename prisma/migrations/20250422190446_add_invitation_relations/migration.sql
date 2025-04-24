/*
  Warnings:

  - Added the required column `invitedBy` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "invitedBy" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Invitation_invitedBy_idx" ON "Invitation"("invitedBy");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
