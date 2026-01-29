import { hashPassword } from "better-auth/crypto";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const categories = [
    "Web Development",
    "Mathematics",
    "Physics",
    "English",
    "Data Science",
  ];

  for (const name of categories) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminEmail = "mdrakibandrokib@gmail.com";
  const hashedPassword = await hashPassword("admin1234");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Rakibul",
      email: adminEmail,
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
}

main()
  .then(async () => {
    console.log("🏁 Seed execution finished.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    process.exit(1);
  });
