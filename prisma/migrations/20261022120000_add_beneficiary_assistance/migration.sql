CREATE TYPE "AssistanceType" AS ENUM (
    'FINANCIAL_ASSISTANCE',
    'MEDICAL_ASSISTANCE',
    'FOOD_ASSISTANCE',
    'BURIAL_FUNERAL_ASSISTANCE',
    'TRANSPORTATION_ASSISTANCE',
    'EDUCATIONAL_ASSISTANCE',
    'PSYCHOSOCIAL_SUPPORT',
    'REFERRAL_LINKAGE',
    'OTHER'
);

CREATE TABLE "BeneficiaryAssistance" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "type" "AssistanceType" NOT NULL,
    "otherType" TEXT,
    "providedAt" DATE NOT NULL,
    "notes" TEXT,
    "providedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeneficiaryAssistance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BeneficiaryAssistance_beneficiaryId_providedAt_idx"
ON "BeneficiaryAssistance"("beneficiaryId", "providedAt");

CREATE INDEX "BeneficiaryAssistance_providedById_providedAt_idx"
ON "BeneficiaryAssistance"("providedById", "providedAt");

ALTER TABLE "BeneficiaryAssistance"
ADD CONSTRAINT "BeneficiaryAssistance_beneficiaryId_fkey"
FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BeneficiaryAssistance"
ADD CONSTRAINT "BeneficiaryAssistance_providedById_fkey"
FOREIGN KEY ("providedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
