WITH ranked AS (
  SELECT
    "id",
    LOWER(TRIM("firstName")) || '|' || LOWER(TRIM(COALESCE("middleName", ''))) || '|' || LOWER(TRIM("lastName")) AS base_key,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM("firstName")), LOWER(TRIM(COALESCE("middleName", ''))), LOWER(TRIM("lastName"))
      ORDER BY "createdAt", "id"
    ) AS position
  FROM "Beneficiary"
  WHERE "nameIdentityKey" IS NULL
)
UPDATE "Beneficiary" AS beneficiary
SET "nameIdentityKey" = CASE
  WHEN ranked.position = 1 THEN ranked.base_key
  ELSE ranked.base_key || '|legacy-' || ranked."id"
END
FROM ranked
WHERE beneficiary."id" = ranked."id";
