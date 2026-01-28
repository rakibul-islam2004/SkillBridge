import { prisma } from "../../lib/prisma";
import { auth as betterAuth } from "../../lib/auth";

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
          include: { bookings: true }, // Example: include relations
        });

      case "TUTOR":
        return prisma.tutorProfile.upsert({
          where: { userId },
          update: {},
          create: { userId },
          include: {
            tutorCategories: { include: { category: true } },
            pricings: true,
          },
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
          data: { bio: data.bio },
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
          data: { isActive: data.isActive },
        });

      default:
        throw new Error("Invalid role");
    }
  },

  // ---------------- BETTER AUTH PASSWORD ----------------
  async updatePassword(headers: Headers, oldPw: string, newPw: string) {
    return await betterAuth.api.changePassword({
      headers,
      body: {
        currentPassword: oldPw,
        newPassword: newPw,
      },
    });
  },
};
