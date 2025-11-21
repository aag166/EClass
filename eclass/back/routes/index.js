const express = require("express");
const router = express.Router();

const usersRoutes = require("./users.routes");
const coursesRoutes = require("./courses.routes");
const modulesRoutes = require("./modules.routes");
const activitiesRoutes = require("./activities.routes");
const classesRoutes = require("./classes.routes");
const authRoutes = require("./auth.routes"); // apunta a auth.routes.js


router.use("/users", usersRoutes);
router.use("/courses", coursesRoutes);
router.use("/modules", modulesRoutes);
router.use("/activities", activitiesRoutes);
router.use("/classes", classesRoutes);

router.use("/auth", authRoutes); // monta /auth en /api → /api/auth

module.exports = router;
