require("dotenv").config({ path: __dirname + "/.env" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);  // DEBUG

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const courses = await prisma.course.findMany();

  console.log("Usuarios:", users);
  console.log("Cursos:", courses);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
