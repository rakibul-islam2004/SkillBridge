import { Request, Response } from "express";
import { BookingService } from "./booking.service";

export const BookingController = {
  async listTutors(req: Request, res: Response) {
    try {
      const { categoryId, search, minPrice, maxPrice } = req.query;

      const tutors = await BookingService.findTutors({
        categoryId: categoryId as string | undefined,
        search: search as string | undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      });

      res.json(tutors);
    } catch (err: any) {
      res.status(500).json({ message: "Server error" });
    }
  },

  async getTutorProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: "ID required" });

      const profile = await BookingService.getTutorDetails(id as string);
      res.json(profile);
    } catch (err) {
      res.status(404).json({ message: "Tutor not found" });
    }
  },

  async confirmBooking(req: Request, res: Response) {
    try {
      const booking = await BookingService.createBooking({
        studentId: req.user!.studentId!,
        studentUserId: req.user!.id,
        ...req.body,
      });
      res.status(201).json({ success: true, data: booking });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // Fetch featured tutors
  async listFeatured(req: Request, res: Response) {
    const tutors = await BookingService.getFeatured();
    res.json({ success: true, data: tutors });
  },

  async cancelBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id || typeof id !== "string") {
        return res
          .status(400)
          .json({ message: "Valid Booking ID is required" });
      }

      const result = await BookingService.cancelBooking(
        id,
        reason || "No reason provided",
      );
      res.json({ success: true, message: "Booking cancelled", data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async submitReview(req: Request, res: Response) {
    try {
      const review = await BookingService.leaveReview({
        studentId: req.user!.studentId!,
        ...req.body,
      });
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async myBookings(req: Request, res: Response) {
    try {
      const bookings = await BookingService.getUserBookings(
        req.user?.studentId,
        req.user?.tutorId,
      );
      res.json(bookings);
    } catch (err: any) {
      res.status(500).json({ message: "Server error" });
    }
  },
};
