import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const adminEmail = "mdrakibul@gmail.com";
  const hashedPassword = await hashPassword("Admin1234");

  // Seed Admin
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      emailVerified: true,
    },
    create: {
      name: "Rakibul",
      email: adminEmail,
      role: "ADMIN",
      emailVerified: true,
      adminProfile: { create: { isActive: true } },
      accounts: {
        create: {
          id: "admin-acc",
          accountId: "admin-acc",
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  // Seed Categories
  const categories = [
    "Web Development",
    "Mathematics",
    "Physics",
    "English",
    "Data Science",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
