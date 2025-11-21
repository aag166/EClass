/*
  Warnings:

  - You are about to drop the column `subject` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ClassCourse` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `curso` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClassCourse" DROP CONSTRAINT "ClassCourse_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_courseId_fkey";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "subject";

-- AlterTable
ALTER TABLE "ClassCourse" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "courseId",
DROP COLUMN "curso";
