/*
  Warnings:

  - You are about to drop the `ClassCourse` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `ClassStudent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClassCourse" DROP CONSTRAINT "ClassCourse_classId_fkey";

-- DropForeignKey
ALTER TABLE "ClassCourse" DROP CONSTRAINT "ClassCourse_courseId_fkey";

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "courseId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ClassCourse";

-- CreateIndex
CREATE UNIQUE INDEX "ClassStudent_studentId_key" ON "ClassStudent"("studentId");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
