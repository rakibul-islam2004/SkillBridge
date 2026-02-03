import { Router } from "express";
import { TutorController } from "./tutor.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", TutorController.getDashboardData);
router.post("/setup", TutorController.setupTutor);

// For calendar UI
router.get("/calendar", TutorController.getCalendar);
router.delete("/availability/:availabilityId", TutorController.deleteAvailability);

export default router;
