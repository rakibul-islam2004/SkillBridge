import { prisma } from "../../lib/prisma";

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
