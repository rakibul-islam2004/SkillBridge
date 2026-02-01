import { prisma } from "../../lib/prisma";

export const BookingService = {
  // DISCOVERY: Search with Price, Rating, and Category filters
  async findTutors(filters: {
    categoryId?: string | undefined;
    search?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sortBy?: string | undefined;
  }) {
    const where: any = { isActive: true };
    let orderBy: any = {};

    if (filters.sortBy === "rating-desc") {
      orderBy = { ratingAvg: "desc" };
    } else if (filters.sortBy === "price-asc") {
      // Note: Prisma ordering by relation aggregate is limited. 
      // We'll use id as a secondary sort. 
      // In a real app, startingPrice would be denormalized.
      orderBy = { createdAt: "asc" }; 
    } else {
      orderBy = { createdAt: "desc" };
    }

    if (filters.categoryId) {
      where.tutorCategories = { some: { categoryId: filters.categoryId } };
    }

    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
        { bio: { contains: filters.search, mode: "insensitive" } },
        { experienceDetails: { contains: filters.search, mode: "insensitive" } },
        { tutorCategories: { some: { category: { name: { contains: filters.search, mode: "insensitive" } } } } }
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      where.pricings = {
        some: {
          price: {
            gte: filters.minPrice ? Number(filters.minPrice) : undefined,
            lte: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          },
          isActive: true,
        },
      };
    }

    return prisma.tutorProfile.findMany({
      where,
      orderBy,
      include: {
        user: { select: { name: true, image: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });
  },

  // PUBLIC FEATURE
  async getTutorDetails(tutorId: string) {
    return prisma.tutorProfile.findUniqueOrThrow({
      where: { id: tutorId },
      include: {
        user: { select: { name: true, image: true, email: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: {
          include: {
            student: {
              include: { user: { select: { name: true, image: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        availabilities: {
          where: { 
            startTime: { gte: new Date() },
            deletedAt: null,
          },
          include: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "PENDING"] }
              },
              select: { id: true, status: true }
            }
          },
          orderBy: { startTime: "asc" },
        },
      },
    });
  },

  async createBooking(data: {
    studentId: string;
    studentUserId: string;
    tutorId: string;
    pricingId: string;
    availabilityId: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Conflict Prevention
      const existing = await tx.booking.findFirst({
        where: {
          availabilityId: data.availabilityId,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      });
      if (existing) throw new Error("This slot is already booked.");

      const slot = await tx.tutorAvailability.findUniqueOrThrow({
        where: { id: data.availabilityId },
      });

      // Generate Workable Jitsi link
      const roomName = `SB-${data.tutorId.slice(0, 8)}-${data.availabilityId.slice(0, 8)}`;
      const meetingLink = `https://meet.jit.si/${roomName}`;

      const booking = await tx.booking.create({
        data: {
          studentId: data.studentId,
          tutorId: data.tutorId,
          pricingId: data.pricingId,
          availabilityId: data.availabilityId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "CONFIRMED",
          meetingLink,
          meetingLinkType: "jitsi-meet",
        },
      });

      const tutor = await tx.tutorProfile.findUnique({
        where: { id: data.tutorId },
        select: { userId: true },
      });

      await tx.notification.create({
        data: {
          userId: tutor!.userId,
          type: "booking_confirmed",
          title: "New Booking!",
          message: `A student has booked a session for ${slot.startTime.toLocaleString()}.`,
          relatedBookingId: booking.id,
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

  // Get ONLY manually featured tutors (returns empty if none)
  async getFeaturedOnly() {
    return prisma.tutorProfile.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: 6,
      orderBy: { featuredAt: "desc" },
      include: {
        user: { select: { name: true, image: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });
  },

  // Get top-rated tutors (always returns results if tutors exist)
  async getTopRated() {
    return prisma.tutorProfile.findMany({
      where: { 
        isActive: true,
      },
      take: 6,
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, image: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });
  },

  // Legacy method - returns featured OR top-rated (for backward compatibility)
  async getFeatured() {
    const featuredTutors = await this.getFeaturedOnly();
    
    if (featuredTutors.length >= 6) return featuredTutors;

    // Fill the rest with top rated tutors
    const featuredIds = featuredTutors.map((t) => t.id);
    const fillerTutors = await prisma.tutorProfile.findMany({
      where: { 
        isActive: true,
        id: { notIn: featuredIds }
      },
      take: 6 - featuredTutors.length,
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      include: {
        user: { select: { name: true, image: true } },
        tutorCategories: { include: { category: true } },
        pricings: { where: { isActive: true } },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });

    return [...featuredTutors, ...fillerTutors];
  },

  async cancelBooking(bookingId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      await tx.calendarBlock.deleteMany({
        where: { bookingId },
      });

      return updatedBooking;
    });
  },

  // REVIEW FEATURE: Submit feedback and update Tutor ratingAvg
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

      const tutor = await tx.tutorProfile.update({
        where: { id: data.tutorId },
        data: { ratingAvg: stats._avg.rating || 0 },
        select: { userId: true },
      });

      await tx.notification.create({
        data: {
          userId: tutor.userId,
          type: "review_received",
          title: "New Review!",
          message: `A student left you a ${data.rating}-star review.`,
          relatedBookingId: data.bookingId,
        },
      });

      return review;
    });
  },

  // USER DASHBOARD: Fetch booking history for Student or Tutor
  async getUserBookings(
    studentId?: string | undefined,
    tutorId?: string | undefined,
  ) {
    const conditions = [];
    if (studentId) conditions.push({ studentId });
    if (tutorId) conditions.push({ tutorId });

    return prisma.booking.findMany({
      where: conditions.length > 0 ? { OR: conditions } : {},
      include: {
        tutor: { include: { user: { select: { name: true } } } },
        student: { include: { user: { select: { name: true } } } },
        pricing: true,
        review: true,
      },
      orderBy: { startTime: "desc" },
    });
  },
};
