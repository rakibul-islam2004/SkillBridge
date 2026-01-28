import { Request, Response } from "express";
import { ProfileService } from "./profile.service";

export const ProfileController = {
  async getMe(req: Request, res: Response) {
    const user = req.user!;

    const profile = await ProfileService.get({
      userId: user.id,
      role: user.role,
    });

    res.json(profile);
  },

  async updateMe(req: Request, res: Response) {
    const user = req.user!;

    const updated = await ProfileService.update(
      {
        userId: user.id,
        role: user.role,
      },
      req.body
    );

    res.json(updated);
  },
};
