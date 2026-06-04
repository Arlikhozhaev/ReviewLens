-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CSV', 'URL');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "shareableSlug" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT,
    "fileName" TEXT,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "author" TEXT,
    "date" TEXT,
    "sentiment" TEXT,
    "clusterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "sentimentData" JSONB NOT NULL,
    "themesData" JSONB NOT NULL,
    "averageRating" DOUBLE PRECISION,
    "processingMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisSession_shareableSlug_key" ON "AnalysisSession"("shareableSlug");

-- CreateIndex
CREATE INDEX "AnalysisSession_shareableSlug_idx" ON "AnalysisSession"("shareableSlug");

-- CreateIndex
CREATE INDEX "AnalysisSession_createdAt_idx" ON "AnalysisSession"("createdAt");

-- CreateIndex
CREATE INDEX "Review_sessionId_idx" ON "Review"("sessionId");

-- CreateIndex
CREATE INDEX "Review_clusterId_idx" ON "Review"("clusterId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_sessionId_key" ON "AnalysisResult"("sessionId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
