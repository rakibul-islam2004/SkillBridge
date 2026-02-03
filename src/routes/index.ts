import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes.js";
import tutorRoutes from "../modules/tutor/tutor.routes.js";
import bookingRoutes from "../modules/booking/booking.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";

const routes = Router();

routes.use("/profile", profileRoutes);
routes.use("/tutor", tutorRoutes);
routes.use("/booking", bookingRoutes); // Changed from /bookings to /booking
routes.use("/notifications", notificationRoutes);
routes.use("/admin", adminRoutes);
routes.use("/category", categoryRoutes); // Changed from /categories to /category

export default routes;
