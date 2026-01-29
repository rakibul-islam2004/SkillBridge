import { prisma } from "../../lib/prisma";

export const BookingService = {
  // DISCOVERY
  async findTutors(filters: { categoryId?: string; search?: string }) {
    const where: any = { isActive: true };

    if (filters.categoryId) {
      where.tutorCategories = { some: { categoryId: filters.categoryId } };
    }

    if (filters.search) {
      where.user = { name: { contains: filters.search, mode: "insensitive" } };
    }

    return prisma.tutorProfile.findMany({
      where,
      include: {
        user: { select: { name: true, image: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: { select: { rating: true } },
      },
    });
  },

  // BOOKING CORE
  async createBooking(data: {
    studentId: string;
    studentUserId: string;
    tutorId: string;
    pricingId: string;
    availabilityId: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const slot = await tx.tutorAvailability.findUniqueOrThrow({
        where: { id: data.availabilityId },
      });

      const booking = await tx.booking.create({
        data: {
          studentId: data.studentId,
          tutorId: data.tutorId,
          pricingId: data.pricingId,
          availabilityId: data.availabilityId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "CONFIRMED",
        },
      });

      await tx.calendarBlock.create({
        data: {
          userId: data.studentUserId,
          availabilityId: data.availabilityId,
          bookingId: booking.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: "LEARNING",
        },
      });

      await tx.calendarBlock.updateMany({
        where: { availabilityId: data.availabilityId, type: "TEACHING" },
        data: { bookingId: booking.id },
      });

      return booking;
    });
  },

  // COMPLETE & REVIEW
  async leaveReview(data: {
    bookingId: string;
    studentId: string;
    tutorId: string;
    rating: number;
    comment: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({ data });

      await tx.booking.update({
        where: { id: data.bookingId },
        data: { status: "COMPLETED" },
      });

      const stats = await tx.review.aggregate({
        where: { tutorId: data.tutorId },
        _avg: { rating: true },
      });

      await tx.tutorProfile.update({
        where: { id: data.tutorId },
        data: { ratingAvg: stats._avg.rating || 0 },
      });

      return review;
    });
  },

  async getUserBookings(studentId?: string, tutorId?: string) {
    const conditions = [];
    if (studentId) conditions.push({ studentId });
    if (tutorId) conditions.push({ tutorId });

    return prisma.booking.findMany({
      where: conditions.length > 0 ? { OR: conditions } : {},
      include: {
        tutor: { include: { user: { select: { name: true } } } },
        student: { include: { user: { select: { name: true } } } },
        review: true,
      },
      orderBy: { startTime: "desc" },
    });
  },
};
