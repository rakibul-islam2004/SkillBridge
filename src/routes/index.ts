import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes";
import tutorRoutes from "../modules/tutor/tutor.routes";

const routes = Router();

routes.use("/profile", profileRoutes);
routes.use("/tutor", tutorRoutes);

export default routes;
