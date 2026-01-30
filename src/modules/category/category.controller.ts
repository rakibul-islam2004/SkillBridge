import { Request, Response } from "express";
import { CategoryService } from "./category.service";

export const CategoryController = {
  async getAll(req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  },
};
