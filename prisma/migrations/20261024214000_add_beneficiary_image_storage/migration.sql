CREATE TYPE "BeneficiaryFileType" AS ENUM ('VALID_ID_FRONT', 'VALID_ID_BACK', 'PROFILE_IMAGE');

ALTER TABLE "Document"
ADD COLUMN "content" BYTEA,
ADD COLUMN "fileType" "BeneficiaryFileType";
