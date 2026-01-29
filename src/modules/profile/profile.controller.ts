import { Request, Response } from "express";
import { ProfileService } from "./profile.service";

export const ProfileController = {
  async getMe(req: Request, res: Response) {
    try {
      const user = req.user!; 
      const profile = await ProfileService.get({
        userId: user.id,
        role: user.role as any,
      });
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  },

  async updateMe(req: Request, res: Response) {
    try {
      const updated = await ProfileService.update(
        { userId: req.user!.id, role: req.user!.role as any },
        req.body,
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Update failed" });
    }
  },

  async updatePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const headers = new Headers(req.headers as any);

      await ProfileService.updatePassword(headers, oldPassword, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (err: any) {
      res
        .status(400)
        .json({ message: err.message || "Password update failed" });
    }
  },
   async onboard(req: Request, res: Response) {
    try {
      const { role } = req.body; // Expecting { "role": "STUDENT" } or "TUTOR"
      const userId = req.user!.id;

      if (!role || !["STUDENT", "TUTOR"].includes(role)) {
        return res.status(400).json({ message: "Please select a valid role: STUDENT or TUTOR" });
      }

      const profile = await ProfileService.initializeRole(userId, role);

      res.status(201).json({
        success: true,
        message: "Profile created successfully",
        data: profile,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },
};
