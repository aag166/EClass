/*
  Warnings:

  - Made the column `courseId` on table `Class` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_courseId_fkey";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "subject" TEXT NOT NULL DEFAULT 'Sin asignatura',
ALTER COLUMN "courseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
