const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// Crear un curso
router.post("/", authMiddleware, async (req, res) => {
  const { title, description } = req.body;

  const newCourse = await prisma.course.create({
    data: {
      title,
      description,
      professorId: req.user.userId,
    },
  });

  res.json(newCourse);
});

// Listar cursos del profesor 
router.get("/", authMiddleware, async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { professorId: req.user.userId },
  });
  res.json(courses);
});

module.exports = router;
