const express = require("express");
const app = express();

app.use(express.json());

// Importar rutas
const routes = require("../routes");

// Ruta de prueba
app.use("/api/test", (req, res) => res.send("test funciona"));

// Montar todas las rutas de la API
app.use("/api", routes);

module.exports = app;
