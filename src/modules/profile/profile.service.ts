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
        return prisma.studentProfile.findUnique({
          where: { userId },
          include: { bookings: true },
        });

      case "TUTOR":
        return prisma.tutorProfile.findUnique({
          where: { userId },
          include: {
            tutorCategories: { include: { category: true } },
            pricings: true,
            availabilities: {
              orderBy: { startTime: "asc" },
            },
          },
        });

      case "ADMIN":
        return prisma.admin.findUnique({
          where: { userId },
        });

      default:
        throw new Error("Invalid role");
    }
  },

  // ---------------- UPDATE PROFILE ----------------
  async update(ctx: Context, data: any) {
    const { userId, role } = ctx;

    return await prisma.$transaction(async (tx) => {
      // 1. Update core user data if provided (e.g. name, image)
      if (data.name || data.image) {
        await tx.user.update({
          where: { id: userId },
          data: { 
            name: data.name,
            image: data.image
          },
        });
      }

      // 2. Update role-specific profile
      switch (role) {
        case "STUDENT":
          return tx.studentProfile.update({
            where: { userId },
            data: { bio: data.bio },
          });

        case "TUTOR":
          return tx.tutorProfile.update({
            where: { userId },
            data: {
              bio: data.bio,
              experience: data.experience,
              experienceDetails: data.experienceDetails,
              isActive: data.isActive,
            },
          });

        case "ADMIN":
          return tx.admin.update({
            where: { userId },
            data: { isActive: data.isActive },
          });

        default:
          throw new Error("Invalid role");
      }
    });
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

  // ---------------- Role Onboarding ----------------
  async initializeRole(userId: string, role: "STUDENT" | "TUTOR") {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      const [user, existingStudent, existingTutor, existingAdmin] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.studentProfile.findUnique({ where: { userId } }),
        tx.tutorProfile.findUnique({ where: { userId } }),
        tx.admin.findUnique({ where: { userId } }),
      ]);

      if (!user) throw new Error("User not found");

      // 2. Identify already existing profile
      const currentProfile = existingStudent || existingTutor || existingAdmin;

      // 3. Conflict Check
      if (currentProfile) {
        let existingRole: string = "STUDENT";
        if (existingTutor) existingRole = "TUTOR";
        if (existingAdmin) existingRole = "ADMIN";

        if (existingRole !== role) {
          throw new Error(`Conflict: User already has a ${existingRole} profile.`);
        }
      }

      // 4. Update core User role for session synchronization (Fixes the loop)
      await tx.user.update({
        where: { id: userId },
        data: { role },
      });

      // 5. Create specific Profile only if it doesn't exist
      if (!currentProfile) {
        if (role === "STUDENT") {
          await tx.studentProfile.create({ data: { userId } });
        } else {
          await tx.tutorProfile.create({
            data: { userId, isActive: true, ratingAvg: 0 },
          });
        }
      }

      return { success: true, role };
    });
  },
};
