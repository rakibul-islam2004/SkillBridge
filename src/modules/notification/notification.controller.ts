import { Request, Response } from "express";
import { NotificationService } from "./notification.service.js";

export const NotificationController = {
  async list(req: Request, res: Response) {
    const data = await NotificationService.getMyNotifications(req.user!.id);
    res.json({ success: true, data });
  },

  async read(req: Request, res: Response) {
    const { id } = req.params;
        if (!id || typeof id !== "string") {
      return res.status(400).json({ 
        success: false, 
        message: "Valid Notification ID is required" 
      });
    }
    await NotificationService.markAsRead(id);
    res.json({ success: true, message: "Notification read" });
  },

  async readAll(req: Request, res: Response) {
    await NotificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: "All notifications marked as read" });
  },
};
