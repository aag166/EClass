const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/users
router.get("/", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(user);
});

// POST /api/users
router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  const newUser = await prisma.user.create({
    data: { name, email, password, role },
  });
  res.json(newUser);
});

module.exports = router;
