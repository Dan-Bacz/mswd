-- AlterTable
ALTER TABLE "BeneficiaryAssistance" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StaffIdDocument" ADD COLUMN     "backContent" BYTEA,
ADD COLUMN     "backFileName" TEXT,
ADD COLUMN     "backMimeType" TEXT,
ADD COLUMN     "backOriginalName" TEXT,
ADD COLUMN     "backSize" INTEGER,
ADD COLUMN     "frontContent" BYTEA,
ADD COLUMN     "frontFileName" TEXT,
ADD COLUMN     "frontMimeType" TEXT,
ADD COLUMN     "frontOriginalName" TEXT,
ADD COLUMN     "frontSize" INTEGER;
