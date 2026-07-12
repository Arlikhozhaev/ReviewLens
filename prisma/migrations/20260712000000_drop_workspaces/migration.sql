-- DropForeignKey
ALTER TABLE "AnalysisSession" DROP CONSTRAINT "AnalysisSession_organizationId_fkey";

-- DropIndex
DROP INDEX "AnalysisSession_organizationId_idx";

-- AlterTable
ALTER TABLE "AnalysisSession" DROP COLUMN "organizationId";

-- DropTable
DROP TABLE "OrganizationInvite";
DROP TABLE "OrganizationMember";
DROP TABLE "Organization";

-- DropEnum
DROP TYPE "OrgRole";
DROP TYPE "OrgPlan";
