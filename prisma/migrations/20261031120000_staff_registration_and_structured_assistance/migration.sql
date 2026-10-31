ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "middleName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "position" TEXT,
  ADD COLUMN "employeeId" TEXT;

CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

ALTER TABLE "BeneficiaryAssistance"
  ADD COLUMN "medicineCount" INTEGER,
  ADD COLUMN "providerName" TEXT,
  ADD COLUMN "financialType" TEXT,
  ADD COLUMN "transactionDetails" TEXT;
