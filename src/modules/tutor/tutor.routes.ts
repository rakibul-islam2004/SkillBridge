import { Router } from "express";
import { TutorController } from "./tutor.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", TutorController.getMySchedule);
router.post("/setup", TutorController.setupTutor);

export default router;
