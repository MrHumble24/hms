-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "checkInTime" TEXT DEFAULT '14:00',
ADD COLUMN     "checkOutTime" TEXT DEFAULT '12:00',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "description" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isSetupCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "website" TEXT;
