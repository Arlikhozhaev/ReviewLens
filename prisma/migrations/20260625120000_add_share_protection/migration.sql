-- AlterTable: optional password + expiry for shareable links
ALTER TABLE "AnalysisSession" ADD COLUMN "sharePasswordHash" TEXT;
ALTER TABLE "AnalysisSession" ADD COLUMN "shareExpiresAt" TIMESTAMP(3);
