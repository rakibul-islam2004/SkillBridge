import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes";
import tutorRoutes from "../modules/tutor/tutor.routes";
import bookingRoutes from "../modules/booking/booking.routes";
import notificationRoutes from "../modules/notification/notification.routes.js";
import adminRoutes from "../modules/admin/admin.routes";
import categoryRoutes from "../modules/category/category.routes";

const routes = Router();

routes.use("/profile", profileRoutes);
routes.use("/tutor", tutorRoutes);
routes.use("/bookings", bookingRoutes);
routes.use("/notifications", notificationRoutes);
routes.use("/admin", adminRoutes);
routes.use("/categories", categoryRoutes);

export default routes;
