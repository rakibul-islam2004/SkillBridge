import { prisma } from "../../lib/prisma";

export const AdminService = {
  // Get all users
  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        studentProfile: {
          select: { id: true, createdAt: true },
        },
        tutorProfile: {
          select: {
            id: true,
            isActive: true,
            createdAt: true,
            ratingAvg: true,
          },
        },
        adminProfile: {
          select: { id: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Manage user status
  async updateUserStatus(
    userId: string,
    role: "TUTOR" | "ADMIN",
    isActive: boolean,
  ) {
    if (role === "TUTOR") {
      return prisma.tutorProfile.update({
        where: { userId },
        data: { isActive },
      });
    }
    if (role === "ADMIN") {
      return prisma.admin.update({
        where: { userId },
        data: { isActive },
      });
    }
    throw new Error("Only Tutor and Admin statuses can be modified");
  },

  //Feature/Unfeature a tutor for the landing page
  async toggleFeatured(tutorId: string, isFeatured: boolean) {
    return prisma.tutorProfile.update({
      where: { id: tutorId },
      data: {
        isFeatured,
        featuredAt: isFeatured ? new Date() : null,
      },
    });
  },

  // Manage categories
  async getAllCategories() {
    return prisma.category.findMany({
      include: {
        _count: { select: { tutorCategories: true } },
      },
    });
  },

  async createCategory(name: string) {
    return prisma.category.create({
      data: { name },
    });
  },

  // View all bookings
  async getAllBookings() {
    return prisma.booking.findMany({
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        tutor: { include: { user: { select: { name: true, email: true } } } },
        pricing: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Analytics
  async getDashboardStats() {
    const [totalUsers, totalBookings, activeTutors] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.tutorProfile.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      totalBookings,
      activeTutors,
    };
  },
};
