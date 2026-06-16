/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SpaceVisibility" AS ENUM ('PUBLIC', 'SELECTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "visibility" "SpaceVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarAccent" TEXT NOT NULL DEFAULT '#8B6CF6',
ADD COLUMN     "avatarTone" TEXT NOT NULL DEFAULT 'orange',
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#8B6CF6',
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '🐾';

-- CreateTable
CREATE TABLE "SpaceViewer" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceViewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpaceViewer_userId_idx" ON "SpaceViewer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceViewer_spaceId_userId_key" ON "SpaceViewer"("spaceId", "userId");

-- CreateIndex
CREATE INDEX "Space_workspaceId_visibility_idx" ON "Space"("workspaceId", "visibility");

-- CreateIndex
CREATE INDEX "Space_ownerId_idx" ON "Space"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceViewer" ADD CONSTRAINT "SpaceViewer_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceViewer" ADD CONSTRAINT "SpaceViewer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
