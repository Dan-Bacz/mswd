CREATE TYPE "OfficerVerificationStatus" AS ENUM ('NOT_STARTED', 'QR_DECODED', 'INCONCLUSIVE', 'MANUAL_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

CREATE TABLE "OfficerVerificationSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "qrPayloadHash" TEXT,
    "qrName" TEXT,
    "qrBirthDate" TIMESTAMP(3),
    "qrSex" TEXT,
    "qrStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "qrAuthenticityStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "livenessStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "faceMatchStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "overallStatus" "OfficerVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "manualReviewReason" TEXT,
    "consentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerVerificationSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OfficerVerificationSession_tokenHash_key" ON "OfficerVerificationSession"("tokenHash");
CREATE UNIQUE INDEX "OfficerVerificationSession_userId_key" ON "OfficerVerificationSession"("userId");
CREATE INDEX "OfficerVerificationSession_expiresAt_overallStatus_idx" ON "OfficerVerificationSession"("expiresAt", "overallStatus");

ALTER TABLE "OfficerVerificationSession" ADD CONSTRAINT "OfficerVerificationSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
