BEGIN;

DELETE FROM "Notification"
WHERE "caseId" IS NOT NULL;

DELETE FROM "Document"
WHERE "caseId" IS NOT NULL AND "beneficiaryId" IS NULL;

UPDATE "Document"
SET "caseId" = NULL
WHERE "caseId" IS NOT NULL;

DELETE FROM "Assignment"
WHERE "caseId" IS NOT NULL
  AND "categoryId" IS NULL
  AND "beneficiaryId" IS NULL;

UPDATE "Assignment"
SET "caseId" = NULL
WHERE "caseId" IS NOT NULL;

ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_caseId_fkey";
ALTER TABLE "Case" DROP CONSTRAINT "Case_assignedOfficerId_fkey";
ALTER TABLE "Case" DROP CONSTRAINT "Case_beneficiaryId_fkey";
ALTER TABLE "Case" DROP CONSTRAINT "Case_categoryId_fkey";
ALTER TABLE "CaseHistory" DROP CONSTRAINT "CaseHistory_caseId_fkey";
ALTER TABLE "CaseHistory" DROP CONSTRAINT "CaseHistory_userId_fkey";
ALTER TABLE "Document" DROP CONSTRAINT "Document_caseId_fkey";
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_caseId_fkey";
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_officerId_fkey";
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_serviceTypeId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_caseId_fkey";

ALTER TABLE "Assignment" DROP COLUMN "caseId";
ALTER TABLE "Document" DROP COLUMN "caseId";
ALTER TABLE "Notification" DROP COLUMN "caseId";

DROP TABLE "CaseHistory";
DROP TABLE "Intervention";
DROP TABLE "Case";
DROP TABLE "ServiceType";

DROP TYPE "CasePriority";
DROP TYPE "CaseStatus";

COMMIT;
