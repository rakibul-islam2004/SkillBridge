import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes";
import tutorRoutes from "../modules/tutor/tutor.routes";
import bookingRoutes from "../modules/booking/booking.routes";

const routes = Router();

routes.use("/profile", profileRoutes);
routes.use("/tutor", tutorRoutes);
routes.use("/bookings", bookingRoutes);

export default routes;
