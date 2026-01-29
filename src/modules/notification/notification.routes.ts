import { Router } from "express";
import { NotificationController } from "./notification.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", NotificationController.list);
router.patch("/read-all", NotificationController.readAll);
router.patch("/:id/read", NotificationController.read);

export default router;
