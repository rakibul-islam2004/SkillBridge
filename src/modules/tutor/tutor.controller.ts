import { Request, Response } from "express";
import { TutorService } from "./tutor.service";

export const TutorController = {
  async setupTutor(req: Request, res: Response) {
    try {
      const { tutorId, id: userId } = req.user!;
      const { categoryIds, pricings, availabilitySlots } = req.body;

      if (!tutorId) {
        return res.status(403).json({ message: "Tutor profile not found" });
      }

      // 1. Update Categories
      if (categoryIds && Array.isArray(categoryIds)) {
        await TutorService.updateCategories(tutorId, categoryIds);
      }

      // 2. Add Pricing
      if (pricings && Array.isArray(pricings)) {
        for (const p of pricings) {
          await TutorService.addPricing(tutorId, p);
        }
      }

      // 3. Setup Availability 
      if (availabilitySlots && Array.isArray(availabilitySlots)) {
        const formattedSlots = availabilitySlots.map((slot: any) => ({
          start: new Date(slot.start),
          end: new Date(slot.end),
        }));
        await TutorService.setAvailability(userId, tutorId, formattedSlots);
      }

      res.json({ message: "Tutor profile updated successfully" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Something went wrong" });
    }
  },

  async getMySchedule(req: Request, res: Response) {
    try {
      const data = await TutorService.getTutorFullProfile(req.user!.id);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch schedule" });
    }
  },
};
