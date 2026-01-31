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

  // ---------------- Role Onboarding ----------------
  async initializeRole(userId: string, role: "STUDENT" | "TUTOR") {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current status
      const [user, existingStudent, existingTutor] = await Promise.all([
        tx.user.findUnique({ where: { id: userId } }),
        tx.studentProfile.findUnique({ where: { userId } }),
        tx.tutorProfile.findUnique({ where: { userId } }),
      ]);

      if (!user) throw new Error("User not found");

      // 2. Identify already existing profile
      const currentProfile = existingStudent || existingTutor;

      // 3. Conflict Check: If user already has a DIFFERENT role
      if (currentProfile) {
        const existingRole = existingStudent ? "STUDENT" : "TUTOR";
        if (existingRole !== role) {
          throw new Error(`Conflict: User already has a ${existingRole} profile.`);
        }
        // If it's the SAME role, we'll just ensure the session role is synced below
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
