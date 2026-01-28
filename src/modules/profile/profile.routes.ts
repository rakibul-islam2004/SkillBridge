import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, ProfileController.getMe);
router.patch("/me", authMiddleware, ProfileController.updateMe);

export default router;
