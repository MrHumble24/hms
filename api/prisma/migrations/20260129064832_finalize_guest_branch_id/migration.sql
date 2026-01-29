/*
  Warnings:

  - Made the column `branchId` on table `Guest` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_branchId_fkey";

-- AlterTable
ALTER TABLE "Guest" ALTER COLUMN "branchId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
