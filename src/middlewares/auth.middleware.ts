import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth as betterAuth } from "../lib/auth";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "STUDENT" | "TUTOR" | "ADMIN";
        email: string;
        name: string;
        tutorId?: string | undefined;
        studentId?: string | undefined;
        adminId?: string | undefined;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await betterAuth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) return res.status(401).json({ message: "Unauthorized" });

    const { user } = session;

    const [student, tutor, admin] = await Promise.all([
      prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.tutorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.admin.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
    ]);

    let role: "STUDENT" | "TUTOR" | "ADMIN" = "STUDENT";
    if (admin) role = "ADMIN";
    else if (tutor) role = "TUTOR";

    req.user = {
      id: user.id,
      role,
      email: user.email,
      name: user.name,
      tutorId: tutor?.id,
      studentId: student?.id,
      adminId: admin?.id,
    };

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
