-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('CONCIERGE', 'LAUNDRY', 'SPA', 'TRANSPORT', 'FOOD_BEVERAGE', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChargeType" ADD VALUE 'CONCIERGE';
ALTER TYPE "ChargeType" ADD VALUE 'SPA';
ALTER TYPE "ChargeType" ADD VALUE 'TRANSPORT';
ALTER TYPE "ChargeType" ADD VALUE 'OTHER_SERVICE';

-- AlterEnum
ALTER TYPE "FolioItemSource" ADD VALUE 'SERVICE_MODULE';

-- CreateTable
CREATE TABLE "HotelService" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelServiceRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelService_branchId_category_idx" ON "HotelService"("branchId", "category");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_bookingId_idx" ON "HotelServiceRequest"("bookingId");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_status_idx" ON "HotelServiceRequest"("status");

-- AddForeignKey
ALTER TABLE "HotelService" ADD CONSTRAINT "HotelService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelService" ADD CONSTRAINT "HotelService_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "HotelService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
