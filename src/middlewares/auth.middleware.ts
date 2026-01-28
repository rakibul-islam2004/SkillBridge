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
    let role: "STUDENT" | "TUTOR" | "ADMIN" = "STUDENT";

    const [tutor, admin] = await Promise.all([
      prisma.tutorProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
      prisma.admin.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
    ]);

    if (admin) role = "ADMIN";
    else if (tutor) role = "TUTOR";

    req.user = {
      id: user.id,
      role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
