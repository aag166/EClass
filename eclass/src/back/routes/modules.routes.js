const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// Crear módulo dentro de un curso
router.post("/", authMiddleware, async (req, res) => {
  const { courseId, title, description, order } = req.body;

  const newModule = await prisma.module.create({
    data: { courseId, title, description, order },
  });

  res.json(newModule);
});

// Listar módulos de un curso
router.get("/:courseId", authMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const modules = await prisma.module.findMany({ where: { courseId: parseInt(courseId) } });
  res.json(modules);
});

module.exports = router;
