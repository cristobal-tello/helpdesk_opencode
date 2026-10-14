import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ users });
});

export default router;