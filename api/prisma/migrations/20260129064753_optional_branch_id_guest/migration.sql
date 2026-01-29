-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "branchId" TEXT;

-- CreateIndex
CREATE INDEX "Guest_branchId_idx" ON "Guest"("branchId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
