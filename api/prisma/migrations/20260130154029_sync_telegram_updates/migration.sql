-- AlterEnum
ALTER TYPE "BookingSource" ADD VALUE 'TELEGRAM';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "telegramUserId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_telegramUserId_idx" ON "Booking"("telegramUserId");
