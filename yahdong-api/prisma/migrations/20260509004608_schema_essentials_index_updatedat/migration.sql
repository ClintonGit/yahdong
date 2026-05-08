-- Migration: schema essentials — add updatedAt to all models, FK indexes, Notification.commentId FK,
-- RefreshToken.tokenHash unique, Task.deletedAt soft-delete, composite indexes for hot queries.
--
-- Strategy for updatedAt on existing rows:
--   ADD COLUMN ... NOT NULL DEFAULT CURRENT_TIMESTAMP   (backfill existing rows)
--   ALTER COLUMN ... DROP DEFAULT                       (Prisma @updatedAt manages it at ORM level)
--   For tables that previously had no createdAt either, we add createdAt the same way (DEFAULT now() preserved
--   to match Prisma default behavior).

-- ============================================================
-- 1. DropForeignKey (will recreate with same semantics)
-- ============================================================
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_taskId_fkey";
ALTER TABLE "TaskLabel" DROP CONSTRAINT "TaskLabel_labelId_fkey";
ALTER TABLE "TaskLabel" DROP CONSTRAINT "TaskLabel_taskId_fkey";

-- ============================================================
-- 2. AlterTable — add updatedAt (and createdAt where missing)
-- ============================================================

-- User: add updatedAt
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RefreshToken: add createdAt + updatedAt
ALTER TABLE "RefreshToken" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RefreshToken" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RefreshToken" ALTER COLUMN "updatedAt" DROP DEFAULT;
-- Note: createdAt keeps DEFAULT CURRENT_TIMESTAMP to match Prisma @default(now())

-- Organization: add updatedAt
ALTER TABLE "Organization" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Organization" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- OrgMember: add createdAt + updatedAt
ALTER TABLE "OrgMember" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrgMember" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrgMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Project: add updatedAt
ALTER TABLE "Project" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Project" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ProjectMember: add createdAt + updatedAt
ALTER TABLE "ProjectMember" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectMember" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ProjectInvite: add updatedAt
ALTER TABLE "ProjectInvite" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProjectInvite" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- TaskStatus: add createdAt + updatedAt
ALTER TABLE "TaskStatus" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskStatus" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskStatus" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Task: add deletedAt + updatedAt
ALTER TABLE "Task" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Label: add createdAt + updatedAt
ALTER TABLE "Label" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Label" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Label" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- TaskLabel: add createdAt + updatedAt
ALTER TABLE "TaskLabel" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskLabel" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskLabel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ChecklistItem: add updatedAt
ALTER TABLE "ChecklistItem" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChecklistItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Comment: add updatedAt
ALTER TABLE "Comment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Comment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- TaskAssignee: add createdAt + updatedAt
ALTER TABLE "TaskAssignee" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskAssignee" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "TaskAssignee" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Notification: add updatedAt
ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ============================================================
-- 3. Indexes (FK + composite for hot queries)
-- ============================================================

-- RefreshToken
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- OrgMember
CREATE INDEX "OrgMember_userId_idx" ON "OrgMember"("userId");

-- Project
CREATE INDEX "Project_orgId_deletedAt_idx" ON "Project"("orgId", "deletedAt");

-- ProjectMember
CREATE INDEX "ProjectMember_userId_projectId_idx" ON "ProjectMember"("userId", "projectId");

-- ProjectInvite
CREATE INDEX "ProjectInvite_projectId_email_idx" ON "ProjectInvite"("projectId", "email");

-- TaskStatus
CREATE INDEX "TaskStatus_projectId_idx" ON "TaskStatus"("projectId");

-- Task
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_statusId_idx" ON "Task"("statusId");
CREATE INDEX "Task_projectId_statusId_idx" ON "Task"("projectId", "statusId");
CREATE INDEX "Task_projectId_deletedAt_idx" ON "Task"("projectId", "deletedAt");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_startDate_idx" ON "Task"("startDate");

-- Label
CREATE INDEX "Label_projectId_idx" ON "Label"("projectId");

-- TaskLabel
CREATE INDEX "TaskLabel_taskId_idx" ON "TaskLabel"("taskId");
CREATE INDEX "TaskLabel_labelId_idx" ON "TaskLabel"("labelId");

-- ChecklistItem
CREATE INDEX "ChecklistItem_taskId_idx" ON "ChecklistItem"("taskId");

-- Comment
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- TaskAssignee
CREATE INDEX "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- Notification
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_taskId_idx" ON "Notification"("taskId");
CREATE INDEX "Notification_commentId_idx" ON "Notification"("commentId");

-- ============================================================
-- 4. Recreate FKs that were dropped (same semantics) + new Notification.comment FK
-- ============================================================
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_labelId_fkey"
  FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- New: Notification.commentId now properly references Comment with cascade delete
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
