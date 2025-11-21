require("dotenv").config();
const app = require("./scripts/app.js");

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
