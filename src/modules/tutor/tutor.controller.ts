import { Request, Response } from "express";
import { TutorService } from "./tutor.service";

export const TutorController = {
  async setupTutor(req: Request, res: Response) {
    try {
      const { tutorId, id: userId } = req.user!;
      const { categoryIds, pricings, availabilitySlots, experience, experienceDetails } = req.body;

      if (!tutorId) {
        return res.status(403).json({ message: "Tutor profile not found" });
      }

      const updateData: any = {};
      if (experience !== undefined) updateData.experience = parseInt(experience as string);
      if (experienceDetails !== undefined) updateData.experienceDetails = experienceDetails;

      if (Object.keys(updateData).length > 0) {
        await TutorService.updateProfile(tutorId, updateData);
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

  //For calendar UI
  async getCalendar(req: Request, res: Response) {
    try {
      const blocks = await TutorService.getCalendarView(req.user!.id);

      const events = blocks.map((block) => ({
        id: block.id,
        title: block.booking
          ? `Lesson with ${block.booking.student.user.name}`
          : "Available Slot",
        start: block.startTime,
        end: block.endTime,
        extendedProps: {
          type: block.type,
          status: block.booking?.status || "OPEN",
          studentImage: block.booking?.student.user.image,
        },
      }));

      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch calendar blocks" });
    }
  },

  async deleteAvailability(req: Request, res: Response) {
    try {
      const { id: userId } = req.user!;
      const { availabilityId } = req.params;

      if (!availabilityId) {
        return res.status(400).json({ message: "Availability ID is required" });
      }

      await TutorService.deleteAvailability(userId, availabilityId as string);
      res.json({ message: "Availability slot removed" });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to delete slot" });
    }
  },

  async getDashboardData(req: Request, res: Response) {
    try {
      const data = await TutorService.getDashboardOverview(req.user!.id);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch dashboard data" });
    }
  },
};
