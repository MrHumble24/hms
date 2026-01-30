-- CreateEnum
CREATE TYPE "SystemLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "telegramPhone" TEXT,
ADD COLUMN     "telegramUsername" TEXT;

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "telegramPhone" TEXT,
ADD COLUMN     "telegramUserId" TEXT,
ADD COLUMN     "telegramUsername" TEXT;

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" "SystemLogLevel" NOT NULL DEFAULT 'INFO',
    "context" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_timestamp_idx" ON "SystemLog"("timestamp");

-- CreateIndex
CREATE INDEX "SystemLog_level_idx" ON "SystemLog"("level");
