import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/tutors", BookingController.listTutors);

router.use(authMiddleware);

router.get("/my-bookings", BookingController.myBookings);
router.post("/confirm", BookingController.confirmBooking);
router.post("/review", BookingController.submitReview);

export default router;
