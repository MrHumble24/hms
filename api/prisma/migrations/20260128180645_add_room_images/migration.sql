-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "images" JSONB DEFAULT '[]',
ADD COLUMN     "isGalleryInherited" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "images" JSONB DEFAULT '[]';
