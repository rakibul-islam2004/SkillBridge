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

  // 4. Get Dashboard: Fetch full profile with relations
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
};
