-- A person may be registered in more than one MSWD program.
-- Duplicate protection remains enforced within each category.
DROP INDEX IF EXISTS "Beneficiary_identityKey_key";
DROP INDEX IF EXISTS "Beneficiary_nameIdentityKey_key";

CREATE UNIQUE INDEX "Beneficiary_categoryId_identityKey_key"
ON "Beneficiary" ("categoryId", "identityKey");

CREATE UNIQUE INDEX "Beneficiary_categoryId_nameIdentityKey_key"
ON "Beneficiary" ("categoryId", "nameIdentityKey");
