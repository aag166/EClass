const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/enrollments
router.get("/", async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    include: { user: true, course: true },
  });
  res.json(enrollments);
});

// POST /api/enrollments
router.post("/", async (req, res) => {
  const { userId, courseId } = req.body;
  const enrollment = await prisma.enrollment.create({
    data: { userId, courseId },
  });
  res.json(enrollment);
});

module.exports = router;
