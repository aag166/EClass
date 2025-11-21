/*
  Warnings:

  - You are about to drop the column `courseId` on the `Class` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_courseId_fkey";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "courseId";

-- CreateTable
CREATE TABLE "ClassCourse" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "ClassCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassCourse_classId_idx" ON "ClassCourse"("classId");

-- CreateIndex
CREATE INDEX "ClassCourse_courseId_idx" ON "ClassCourse"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassCourse_classId_courseId_key" ON "ClassCourse"("classId", "courseId");

-- AddForeignKey
ALTER TABLE "ClassCourse" ADD CONSTRAINT "ClassCourse_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCourse" ADD CONSTRAINT "ClassCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassCourse" ADD CONSTRAINT "ClassCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
