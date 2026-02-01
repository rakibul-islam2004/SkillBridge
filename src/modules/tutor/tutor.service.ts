import { prisma } from "../../lib/prisma";

export const TutorService = {
  // 1. Categories: Sync Tutor Categories
  async updateCategories(tutorId: string, categoryIds: string[]) {
    return await prisma.$transaction([
      prisma.tutorCategory.deleteMany({ where: { tutorId } }),
      prisma.tutorCategory.createMany({
        data: categoryIds.map((id) => ({
          tutorId,
          categoryId: id,
        })),
      }),
    ]);
  },

  // 1b. Update Profile: Experience & Bio
  async updateProfile(tutorId: string, data: { experience?: number; experienceDetails?: string; bio?: string }) {
    return await prisma.tutorProfile.update({
      where: { id: tutorId },
      data,
    });
  },

  // 2. Pricing: Add new pricing entry
  async addPricing(tutorId: string, data: { duration: number; price: number }) {
    return prisma.tutorPricing.create({
      data: {
        tutorId,
        durationMinutes: data.duration,
        price: data.price,
      },
    });
  },

  // 3. Availability: Create Slots & Calendar Blocks (Transactional)
  async setAvailability(
    userId: string,
    tutorId: string,
    slots: { start: Date; end: Date }[],
  ) {
    return await prisma.$transaction(async (tx) => {
      const createdSlots = [];

      for (const slot of slots) {
        const availability = await tx.tutorAvailability.create({
          data: {
            tutorId,
            startTime: slot.start,
            endTime: slot.end,
          },
        });

        // Create Block linked to User and Availability
        await tx.calendarBlock.create({
          data: {
            userId,
            availabilityId: availability.id,
            startTime: slot.start,
            endTime: slot.end,
            type: "TEACHING",
          },
        });

        createdSlots.push(availability);
      }
      return createdSlots;
    });
  },

  // 3b. Delete Availability
  async deleteAvailability(userId: string, availabilityId: string) {
    return await prisma.$transaction([
      prisma.calendarBlock.deleteMany({
        where: { availabilityId, userId },
      }),
      prisma.tutorAvailability.delete({
        where: { id: availabilityId },
      }),
    ]);
  },

  // 4. Get Dashboard: Profile details
  async getTutorFullProfile(userId: string) {
    return prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        availabilities: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
        },
      },
    });
  },

  // 5. Get Calendar: Fetch all blocks including Bookings for the UI
  async getCalendarView(userId: string) {
    return prisma.calendarBlock.findMany({
      where: { userId },
      include: {
        booking: {
          include: {
            student: {
              include: { user: { select: { name: true, image: true } } }
            }
          }
        }
      },
      orderBy: { startTime: "asc" }
    });
  },

  async getDashboardOverview(userId: string) {
    const tutor = await prisma.tutorProfile.findUniqueOrThrow({
      where: { userId },
      select: { id: true, ratingAvg: true }
    });

    const tutorId = tutor.id;
    const now = new Date();

    const [
      totalSessions,
      upcomingCount,
      upcomingSessions,
      recentReviews,
    ] = await Promise.all([
      prisma.booking.count({
        where: { tutorId, status: { in: ["CONFIRMED", "COMPLETED"] } }
      }),
      prisma.booking.count({
        where: { tutorId, status: "CONFIRMED", startTime: { gte: now } }
      }),
      prisma.booking.findMany({
        where: { tutorId, status: "CONFIRMED", startTime: { gte: now } },
        take: 5,
        orderBy: { startTime: "asc" },
        include: {
          student: {
            include: { user: { select: { name: true, image: true } } }
          },
          pricing: true
        }
      }),
      prisma.review.findMany({
        where: { tutorId },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            include: { user: { select: { name: true, image: true } } }
          }
        }
      })
    ]);

    const completedBookings = await prisma.booking.findMany({
      where: { tutorId, status: "COMPLETED" },
      include: { pricing: { select: { price: true } } }
    });
    
    const earnings = completedBookings.reduce((sum, b) => sum + Number(b.pricing.price), 0);
    const reviewCount = await prisma.review.count({ where: { tutorId } });

    return {
      stats: {
        totalSessions,
        upcomingCount,
        totalEarnings: earnings,
        ratingAvg: tutor.ratingAvg || 0,
        reviewCount
      },
      upcomingSessions,
      recentReviews
    };
  }
};
