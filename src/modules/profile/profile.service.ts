import { prisma } from "../../lib/prisma";


type Role = "STUDENT" | "TUTOR" | "ADMIN";

interface Context {
  userId: string;
  role: Role;
}

export const ProfileService = {
  // ---------------- GET PROFILE ----------------
  async get(ctx: Context) {
    const { userId, role } = ctx;

    switch (role) {
      case "STUDENT":
        return prisma.studentProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

      case "TUTOR":
        return prisma.tutorProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

      case "ADMIN":
        return prisma.admin.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

      default:
        throw new Error("Invalid role");
    }
  },

  // ---------------- UPDATE PROFILE ----------------
  async update(ctx: Context, data: any) {
    const { userId, role } = ctx;

    switch (role) {
      case "STUDENT":
        return prisma.studentProfile.update({
          where: { userId },
          data: {
            bio: data.bio,
          },
        });

      case "TUTOR":
        return prisma.tutorProfile.update({
          where: { userId },
          data: {
            bio: data.bio,
            experience: data.experience,
            experienceDetails: data.experienceDetails,
            isActive: data.isActive,
          },
        });

      case "ADMIN":
        return prisma.admin.update({
          where: { userId },
          data: {
            isActive: data.isActive,
          },
        });

      default:
        throw new Error("Invalid role");
    }
  },
};
