-- AlterTable: ProjectMember add starred
ALTER TABLE "ProjectMember" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Task add coverColor
ALTER TABLE "Task" ADD COLUMN "coverColor" TEXT;

-- AlterTable: Project add isPublic + shareToken
ALTER TABLE "Project" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "shareToken" TEXT;
CREATE UNIQUE INDEX "Project_shareToken_key" ON "Project"("shareToken");

-- CreateTable: ProjectInvite
CREATE TABLE "ProjectInvite" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "role" "ProjectRole" NOT NULL DEFAULT 'member',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectInvite_token_key" ON "ProjectInvite"("token");
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
