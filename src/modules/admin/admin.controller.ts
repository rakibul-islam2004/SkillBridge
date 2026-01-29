import { Request, Response } from "express";
import { AdminService } from "./admin.service";

export const AdminController = {
  async listUsers(req: Request, res: Response) {
    const users = await AdminService.getAllUsers();
    res.json(users);
  },

  async updateUserStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { role, isActive } = req.body;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ message: "Valid User ID is required" });
      }

      const updated = await AdminService.updateUserStatus(
        userId,
        role,
        isActive,
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async toggleFeatured(req: Request, res: Response) {
    const { tutorId } = req.params;
    const { isFeatured } = req.body;

    if (!tutorId || typeof tutorId !== "string") {
      return res.status(400).json({ message: "Invalid Tutor ID" });
    }

    try {
      const result = await AdminService.toggleFeatured(tutorId, isFeatured);
      res.json({
        success: true,
        message: isFeatured
          ? "Tutor is now featured"
          : "Tutor removed from featured list",
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async listCategories(req: Request, res: Response) {
    const categories = await AdminService.getAllCategories();
    res.json(categories);
  },

  async addCategory(req: Request, res: Response) {
    try {
      const category = await AdminService.createCategory(req.body.name);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(400).json({ message: "Failed to create category" });
    }
  },

  async listBookings(req: Request, res: Response) {
    const bookings = await AdminService.getAllBookings();
    res.json(bookings);
  },

  async getDashboardStats(req: Request, res: Response) {
    const stats = await AdminService.getDashboardStats();
    res.json(stats);
  },
};
