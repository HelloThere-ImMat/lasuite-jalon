-- AlterEnum
ALTER TYPE "TaskOrigin" ADD VALUE 'MAIL';
ALTER TYPE "TaskOrigin" ADD VALUE 'VISIO';

-- CreateEnum
CREATE TYPE "TaskDetectionStatus" AS ENUM ('DETECTED', 'CONFIRMED', 'IGNORED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "detectionStatus" "TaskDetectionStatus",
ADD COLUMN     "sourceExcerpt" TEXT,
ADD COLUMN     "sourceExternalId" TEXT,
ADD COLUMN     "sourceLabel" TEXT,
ADD COLUMN     "sourceUrl" TEXT;
