const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");

// Crear actividad dentro de un módulo
router.post("/", authMiddleware, async (req, res) => {
  const { moduleId, type, title, content } = req.body;

  const newActivity = await prisma.activity.create({
    data: { moduleId, type, title, content },
  });

  res.json(newActivity);
});

// Listar actividades de un módulo
router.get("/:moduleId", authMiddleware, async (req, res) => {
  const { moduleId } = req.params;
  const activities = await prisma.activity.findMany({ where: { moduleId: parseInt(moduleId) } });
  res.json(activities);
});

module.exports = router;
