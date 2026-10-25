CREATE TYPE "AssistanceOutcome" AS ENUM ('PROVIDED', 'REFERRED', 'FOLLOW_UP', 'NOT_PROVIDED');

ALTER TABLE "BeneficiaryAssistance"
RENAME COLUMN "notes" TO "internalRemarks";

ALTER TABLE "BeneficiaryAssistance"
ADD COLUMN "referenceNumber" TEXT,
ADD COLUMN "visitDate" DATE,
ADD COLUMN "purpose" TEXT,
ADD COLUMN "requestedDescription" TEXT,
ADD COLUMN "outcome" "AssistanceOutcome" NOT NULL DEFAULT 'PROVIDED',
ADD COLUMN "providedDescription" TEXT,
ADD COLUMN "notProvidedReason" TEXT,
ADD COLUMN "referralDetails" TEXT,
ADD COLUMN "followUpReason" TEXT,
ADD COLUMN "followUpNotes" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "BeneficiaryAssistance"
SET
  "referenceNumber" = 'MSWD-' || to_char("providedAt", 'YYYYMMDD') || '-' || upper(substr(replace("id", '-', ''), 1, 8)),
  "visitDate" = "providedAt",
  "purpose" = 'Previously recorded assistance',
  "requestedDescription" = 'Previously recorded assistance';

ALTER TABLE "BeneficiaryAssistance"
ALTER COLUMN "referenceNumber" SET NOT NULL,
ALTER COLUMN "visitDate" SET NOT NULL,
ALTER COLUMN "purpose" SET NOT NULL,
ALTER COLUMN "requestedDescription" SET NOT NULL,
ALTER COLUMN "providedAt" DROP NOT NULL;

CREATE UNIQUE INDEX "BeneficiaryAssistance_referenceNumber_key"
ON "BeneficiaryAssistance"("referenceNumber");

CREATE INDEX "BeneficiaryAssistance_outcome_visitDate_idx"
ON "BeneficiaryAssistance"("outcome", "visitDate");

DROP INDEX "BeneficiaryAssistance_beneficiaryId_providedAt_idx";
DROP INDEX "BeneficiaryAssistance_providedById_providedAt_idx";

CREATE INDEX "BeneficiaryAssistance_beneficiaryId_visitDate_idx"
ON "BeneficiaryAssistance"("beneficiaryId", "visitDate");

CREATE INDEX "BeneficiaryAssistance_providedById_visitDate_idx"
ON "BeneficiaryAssistance"("providedById", "visitDate");
