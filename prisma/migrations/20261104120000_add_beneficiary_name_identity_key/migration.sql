ALTER TABLE "Beneficiary" ADD COLUMN "nameIdentityKey" TEXT;

CREATE UNIQUE INDEX "Beneficiary_nameIdentityKey_key" ON "Beneficiary"("nameIdentityKey");
