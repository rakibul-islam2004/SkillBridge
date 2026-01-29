import { Request, Response } from "express";
import { BookingService } from "./booking.service";

export const BookingController = {
  async listTutors(req: Request, res: Response) {
    try {
      const tutors = await BookingService.findTutors(req.query);
      res.json(tutors);
    } catch (err: any) {
      res.status(500).json({ message: "Server error" });
    }
  },

  async confirmBooking(req: Request, res: Response) {
    try {
      const booking = await BookingService.createBooking({
        studentId: req.user!.studentId!,
        studentUserId: req.user!.id,
        ...req.body,
      });
      res.status(201).json(booking);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
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
