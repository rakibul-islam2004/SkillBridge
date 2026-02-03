import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Verify Admin Role
router.use((req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
});

router.get("/users", AdminController.listUsers);
router.patch("/users/:userId/status", AdminController.updateUserStatus);
router.get("/bookings", AdminController.listBookings);
router.get("/categories", AdminController.listCategories);
router.post("/categories", AdminController.addCategory);
router.get("/stats", AdminController.getDashboardStats);
router.patch("/tutors/:tutorId/featured", AdminController.toggleFeatured);

export default router;
