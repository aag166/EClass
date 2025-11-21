const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());

app.use(cors({
    origin: "http://localhost:3000", // puerto de mi front
    credentials: true
  }));

// Importar rutas
const routes = require("../routes");

// Ruta de prueba
app.use("/api/test", (req, res) => res.send("test funciona"));

// Montar todas las rutas de la API
app.use("/api", routes);

module.exports = app;
