import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { decrypt } from "../utils/crypto.js";
import { ok } from "../utils/responses.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", async (req, res) => {
  const [orders, cards, notifications, wishlist] = await Promise.all([
    prisma.order.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.card.findMany({ where: { userId: req.user!.id } }),
    prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.wishlistItem.findMany({ where: { userId: req.user!.id }, include: { product: true }, take: 4 })
  ]);

  const totalBalance = cards.reduce((sum: number, card: any) => sum + Number(decrypt(card.balanceEncrypted)), 0);

  return ok(res, {
    stats: {
      activeCards: cards.length,
      totalBalance,
      totalOrders: orders.length
    },
    recentOrders: orders,
    notifications,
    recommendations: wishlist.map((item: any) => item.product)
  });
});

