import { Router } from "express";
import profileRoutes from "../modules/profile/profile.routes";

const routes = Router();

routes.use("/profile", profileRoutes);

export default routes;
