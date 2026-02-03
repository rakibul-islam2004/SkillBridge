import { prisma } from "../../lib/prisma.js";

export const CategoryService = {
  async getAllCategories() {
    return prisma.category.findMany({
      include: {
        _count: { select: { tutorCategories: true } },
      },
      orderBy: { name: "asc" },
    });
  },
};
