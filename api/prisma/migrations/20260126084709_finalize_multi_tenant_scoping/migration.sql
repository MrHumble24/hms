/*
  Warnings:

  - Made the column `branchId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `Folio` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Guest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `InventoryItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `RestaurantCategory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `RestaurantMenuItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `RestaurantOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `Room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `branchId` on table `RoomType` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Folio" DROP CONSTRAINT "Folio_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_branchId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantCategory" DROP CONSTRAINT "RestaurantCategory_branchId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantMenuItem" DROP CONSTRAINT "RestaurantMenuItem_branchId_fkey";

-- DropForeignKey
ALTER TABLE "RestaurantOrder" DROP CONSTRAINT "RestaurantOrder_branchId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_branchId_fkey";

-- DropForeignKey
ALTER TABLE "RoomType" DROP CONSTRAINT "RoomType_branchId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Folio" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Guest" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryItem" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RestaurantCategory" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RestaurantMenuItem" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RestaurantOrder" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "RoomType" ALTER COLUMN "branchId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folio" ADD CONSTRAINT "Folio_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantCategory" ADD CONSTRAINT "RestaurantCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantMenuItem" ADD CONSTRAINT "RestaurantMenuItem_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
