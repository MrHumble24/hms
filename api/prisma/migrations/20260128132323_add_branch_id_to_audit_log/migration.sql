-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "branchId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_branchId_createdAt_idx" ON "AuditLog"("tenantId", "branchId", "createdAt");
