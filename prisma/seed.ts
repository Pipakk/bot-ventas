import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@coldcall.dev" },
    update: {},
    create: {
      email: "demo@coldcall.dev",
      passwordHash,
      role: "free",
    },
  });
  console.log("Seed: usuario demo creado", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
