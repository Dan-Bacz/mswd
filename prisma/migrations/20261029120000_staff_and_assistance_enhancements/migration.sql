-- Staff profile fields: keep employee position separate from the employee name.
ALTER TABLE "User"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "middleName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "position" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvalEmailSentAt" TIMESTAMP(3);

-- Structured assistance values replacing free-text input where the office records a type.
ALTER TABLE "BeneficiaryAssistance"
ADD COLUMN "financialAmount" DECIMAL(12,2),
ADD COLUMN "medicineQuantity" INTEGER,
ADD COLUMN "doctorName" TEXT;

-- Notification metadata for linking and duplicate-safe registration alerts.
ALTER TABLE "Notification"
ADD COLUMN "link" TEXT,
ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- Securely stored staff ID document, database-backed like beneficiary documents.
CREATE TABLE "StaffIdDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffIdDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffIdDocument_userId_key" ON "StaffIdDocument"("userId");

ALTER TABLE "StaffIdDocument"
ADD CONSTRAINT "StaffIdDocument_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Duplicate beneficiary protection. Only rows with a date of birth receive a
-- deterministic identity key; legacy duplicate rows keep their history because
-- duplicates are given a unique suffix instead of being deleted or merged.
ALTER TABLE "Beneficiary" ADD COLUMN "identityKey" TEXT;

WITH normalized AS (
    SELECT
        "id",
        lower(regexp_replace(trim("lastName"), '\s+', ' ', 'g')) || '|' ||
        lower(regexp_replace(trim("firstName"), '\s+', ' ', 'g')) || '|' ||
        lower(regexp_replace(coalesce(trim("middleName"), ''), '\s+', ' ', 'g')) || '|' ||
        to_char("dateOfBirth", 'YYYY-MM-DD') || '|' ||
        lower(regexp_replace(coalesce(trim("barangay"), ''), '\s+', ' ', 'g')) AS base_key
    FROM "Beneficiary"
    WHERE "dateOfBirth" IS NOT NULL
),
ranked AS (
    SELECT
        "id",
        base_key,
        row_number() OVER (PARTITION BY base_key ORDER BY "id") AS duplicate_rank
    FROM normalized
)
UPDATE "Beneficiary" AS beneficiary
SET "identityKey" = CASE
    WHEN ranked.duplicate_rank = 1 THEN ranked.base_key
    ELSE ranked.base_key || '#' || beneficiary."id"
END
FROM ranked
WHERE beneficiary."id" = ranked."id";

CREATE UNIQUE INDEX "Beneficiary_identityKey_key" ON "Beneficiary"("identityKey");
