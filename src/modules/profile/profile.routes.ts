import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/me", ProfileController.getMe);
router.patch("/me", ProfileController.updateMe);
router.patch("/me/password", ProfileController.updatePassword);

export default router;
