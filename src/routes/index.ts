import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes";
import tutorRoutes from "../modules/tutor/tutor.routes";
import bookingRoutes from "../modules/booking/booking.routes";
import notificationRoutes from "../modules/notification/notification.routes.js";

const routes = Router();

routes.use("/profile", profileRoutes);
routes.use("/tutor", tutorRoutes);
routes.use("/bookings", bookingRoutes);
routes.use("/notifications", notificationRoutes);

export default routes;
