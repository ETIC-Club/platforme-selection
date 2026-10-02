-- AlterTable
ALTER TABLE "candidates" ALTER COLUMN "final_status" DROP NOT NULL,
ALTER COLUMN "final_status" DROP DEFAULT;
