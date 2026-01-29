import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// PUBLIC
router.get("/tutors", BookingController.listTutors);
router.get("/tutors/:id", BookingController.getTutorProfile);

// PRIVATE
router.use(authMiddleware);
router.get("/my-bookings", BookingController.myBookings);
router.post("/confirm", BookingController.confirmBooking);
router.post("/review", BookingController.submitReview);
router.patch("/:id/cancel", BookingController.cancelBooking);

export default router;
