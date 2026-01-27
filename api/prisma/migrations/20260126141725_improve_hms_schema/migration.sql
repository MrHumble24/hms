/*
  Warnings:

  - You are about to drop the column `actualCheckIn` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `actualCheckOut` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `adultsCount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `childrenCount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `guestId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `FolioItem` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `HousekeepingTask` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `HousekeepingTask` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,branchId,sku]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,branchId,number]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `primaryGuestId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Folio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Folio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `FolioItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `FolioItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `HousekeepingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `HousekeepingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `HousekeepingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `RestaurantOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `RoomType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RoomType` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'NON_REFUNDABLE');

-- CreateEnum
CREATE TYPE "RoomStayStatus" AS ENUM ('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('UZS', 'USD', 'EUR', 'RUB');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('VAT', 'TOURISM_TAX', 'SERVICE_CHARGE', 'CITY_TAX');

-- CreateEnum
CREATE TYPE "HousekeepingTaskType" AS ENUM ('DAILY_CLEAN', 'CHECKOUT_CLEAN', 'DEEP_CLEAN', 'TURNDOWN', 'INSPECTION');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('BOOKING_CONFIRMATION', 'PRE_ARRIVAL', 'WELCOME', 'CHECKOUT_REMINDER', 'POST_STAY_SURVEY', 'MARKETING');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmehmonStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "EmehmonStatus" ADD VALUE 'RETRY';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_guestId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "HousekeepingTask" DROP CONSTRAINT "HousekeepingTask_userId_fkey";

-- DropIndex
DROP INDEX "InventoryItem_branchId_sku_key";

-- DropIndex
DROP INDEX "Room_branchId_number_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "actualCheckIn",
DROP COLUMN "actualCheckOut",
DROP COLUMN "adultsCount",
DROP COLUMN "childrenCount",
DROP COLUMN "guestId",
DROP COLUMN "roomId",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "primaryGuestId" TEXT NOT NULL,
ADD COLUMN     "ratePlanId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmehmonLog" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "qrCodeData" TEXT,
ADD COLUMN     "qrCodeUrl" TEXT,
ADD COLUMN     "regSlipNumber" TEXT,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "responseJson" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Folio" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FolioItem" DROP COLUMN "amount",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UZS',
ADD COLUMN     "isTaxExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
ADD COLUMN     "taxType" "TaxType",
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unitPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "HousekeepingTask" DROP COLUMN "date",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "taskType" "HousekeepingTaskType" NOT NULL DEFAULT 'DAILY_CLEAN',
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "amountInLocal" DECIMAL(10,2),
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'UZS',
ADD COLUMN     "exchangeRate" DECIMAL(12,6),
ADD COLUMN     "receiptNumber" TEXT;

-- AlterTable
ALTER TABLE "RestaurantMenuItem" ADD COLUMN     "isSimpleItem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedInventoryId" TEXT;

-- AlterTable
ALTER TABLE "RestaurantOrder" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDueIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDueOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOccupied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCleanedAt" TIMESTAMP(3),
ADD COLUMN     "lastInspectedAt" TIMESTAMP(3),
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserBranch" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "Role";

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "includesBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "includesParking" BOOLEAN NOT NULL DEFAULT false,
    "includesWifi" BOOLEAN NOT NULL DEFAULT true,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'FLEXIBLE',
    "cancellationHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatePlanRoomType" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "RatePlanRoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomStay" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "roomId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'UZS',
    "adultsCount" INTEGER NOT NULL DEFAULT 1,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "status" "RoomStayStatus" NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomStay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomStayGuest" (
    "id" TEXT NOT NULL,
    "roomStayId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RoomStayGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestCommunication" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" "CommunicationType" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RatePlan_branchId_code_key" ON "RatePlan"("branchId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RatePlanRoomType_ratePlanId_roomTypeId_key" ON "RatePlanRoomType"("ratePlanId", "roomTypeId");

-- CreateIndex
CREATE INDEX "RoomStay_bookingId_idx" ON "RoomStay"("bookingId");

-- CreateIndex
CREATE INDEX "RoomStay_roomId_startDate_endDate_idx" ON "RoomStay"("roomId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "RoomStayGuest_roomStayId_guestId_key" ON "RoomStayGuest"("roomStayId", "guestId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entityType_entityId_idx" ON "AuditLog"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_branchId_checkIn_checkOut_idx" ON "Booking"("branchId", "checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "Booking_tenantId_status_idx" ON "Booking"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Booking_primaryGuestId_idx" ON "Booking"("primaryGuestId");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_deletedAt_idx" ON "Booking"("deletedAt");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "Folio_bookingId_status_idx" ON "Folio"("bookingId", "status");

-- CreateIndex
CREATE INDEX "Folio_branchId_createdAt_idx" ON "Folio"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Folio_tenantId_idx" ON "Folio"("tenantId");

-- CreateIndex
CREATE INDEX "Folio_deletedAt_idx" ON "Folio"("deletedAt");

-- CreateIndex
CREATE INDEX "Guest_deletedAt_idx" ON "Guest"("deletedAt");

-- CreateIndex
CREATE INDEX "HousekeepingTask_roomId_scheduledFor_idx" ON "HousekeepingTask"("roomId", "scheduledFor");

-- CreateIndex
CREATE INDEX "HousekeepingTask_assigneeId_status_idx" ON "HousekeepingTask"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "InventoryItem_branchId_category_idx" ON "InventoryItem"("branchId", "category");

-- CreateIndex
CREATE INDEX "InventoryItem_quantity_minThreshold_idx" ON "InventoryItem"("quantity", "minThreshold");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_tenantId_branchId_sku_key" ON "InventoryItem"("tenantId", "branchId", "sku");

-- CreateIndex
CREATE INDEX "RestaurantOrder_branchId_status_createdAt_idx" ON "RestaurantOrder"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RestaurantOrder_bookingId_idx" ON "RestaurantOrder"("bookingId");

-- CreateIndex
CREATE INDEX "RestaurantOrder_tenantId_idx" ON "RestaurantOrder"("tenantId");

-- CreateIndex
CREATE INDEX "Room_branchId_status_idx" ON "Room"("branchId", "status");

-- CreateIndex
CREATE INDEX "Room_typeId_idx" ON "Room"("typeId");

-- CreateIndex
CREATE INDEX "Room_deletedAt_idx" ON "Room"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Room_tenantId_branchId_number_key" ON "Room"("tenantId", "branchId", "number");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlanRoomType" ADD CONSTRAINT "RatePlanRoomType_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlanRoomType" ADD CONSTRAINT "RatePlanRoomType_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_primaryGuestId_fkey" FOREIGN KEY ("primaryGuestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStay" ADD CONSTRAINT "RoomStay_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStay" ADD CONSTRAINT "RoomStay_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStayGuest" ADD CONSTRAINT "RoomStayGuest_roomStayId_fkey" FOREIGN KEY ("roomStayId") REFERENCES "RoomStay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomStayGuest" ADD CONSTRAINT "RoomStayGuest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folio" ADD CONSTRAINT "Folio_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_linkedInventoryId_fkey" FOREIGN KEY ("linkedInventoryId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestCommunication" ADD CONSTRAINT "GuestCommunication_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestCommunication" ADD CONSTRAINT "GuestCommunication_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
