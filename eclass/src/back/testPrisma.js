const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Sacar todos los usuarios
  const users = await prisma.user.findMany();
  console.log("Usuarios:", users);

  // Sacar todos los cursos
  const courses = await prisma.course.findMany();
  console.log("Cursos:", courses);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
