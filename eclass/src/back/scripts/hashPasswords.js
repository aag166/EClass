// back/scripts/hashPasswords.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function main() {
  const profesores = await prisma.user.findMany({ where: { role: "profesor" } });

  for (const profesor of profesores) {
    const hashed = bcrypt.hashSync(profesor.password, 10);
    await prisma.user.update({
      where: { id: profesor.id },
      data: { password: hashed },
    });
    console.log(`Password hashed for ${profesor.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
