import { Router } from "express";
import { Role, ProductStatus, CardType, PaymentStatus } from "@prisma/client";
import { prisma, formatLocalDate, formatLocalTime } from "../db.js";
import { toCsv } from "../utils/csv.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ok } from "../utils/responses.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler.js";

export const adminRouter = Router();

const adminOnly = [Role.ADMIN];
const managerRead = [Role.ADMIN, Role.MANAGER];

const roleUpdateSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role)
  })
});

const accountFlagSchema = z.object({
  body: z.object({
    flagged: z.boolean().optional(),
    suspended: z.boolean().optional()
  })
});

adminRouter.use(requireAuth);

adminRouter.get("/overview", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const [users, orders, products, flaggedLogs, activities] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.deviceLog.findMany({ where: { flagged: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.adminActivityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: true } })
  ]);

  return ok(res, {
    metrics: { users, orders, products },
    flaggedLogs,
    activities
  });
}));

adminRouter.get("/users", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { addresses: true }
  });
  return ok(res, users);
}));

adminRouter.get("/orders", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      items: true
    }
  });
  return ok(res, orders);
}));

adminRouter.get("/transactions", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { card: true }
  });
  return ok(res, transactions);
}));

adminRouter.patch("/users/:id/role", requireRole(adminOnly), validate(roleUpdateSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { role: req.body.role }
  });

  await prisma.adminActivityLog.create({
    data: {
      actorId: req.user!.id,
      action: "UPDATE_USER_ROLE",
      targetType: "User",
      targetId: user.id
    }
  });

  return ok(res, user, "User role updated");
}));

adminRouter.patch("/users/:id/flags", requireRole(managerRead), validate(accountFlagSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: {
      accountFlagged: req.body.flagged ?? undefined,
      accountSuspended: req.body.suspended ?? undefined
    }
  });

  return ok(res, user, "Account flag updated");
}));

adminRouter.get("/export-csv", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      address: true,
      items: true
    }
  });

  const csv = toCsv(orders.map((order: any) => ({
    id: order.id,
    Date: order.createdAt instanceof Date ? formatLocalDate(order.createdAt) : formatLocalDate(String(order.createdAt)),
    Time: order.createdAt instanceof Date ? formatLocalTime(order.createdAt) : formatLocalTime(String(order.createdAt)),
    userId: order.userId,
    customerName: order.user?.name ?? "",
    customerEmail: order.user?.email ?? "",
    customerPhone: order.user?.phone ?? "",
    customerPan: order.user?.panNumber ?? "",
    deliveryMethod: order.deliveryMethod,
    addressLine1: order.address?.line1 ?? order.user?.deliveryAddressLine1 ?? "",
    addressLine2: order.address?.line2 ?? order.user?.deliveryAddressLine2 ?? "",
    city: order.address?.city ?? order.user?.deliveryCity ?? "",
    state: order.address?.state ?? order.user?.deliveryState ?? "",
    postalCode: order.address?.postalCode ?? order.user?.deliveryPostalCode ?? "",
    country: order.address?.country ?? order.user?.deliveryCountry ?? "India",
    itemsOrdered: (order.items || []).map((item: any) => `${item.quantity}x ${item.title} (${item.cardType}) - ₹${item.amount}`).join("; "),
    giftCardFaceValue: order.giftCardFaceValue,
    deductionRate: order.deductionRate,
    deductionAmount: order.deductionAmount,
    finalCreditedAmount: order.finalCreditedAmount,
    totalPaidAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    couponCode: order.couponCode ?? "",
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference ?? "",
    deliveryStatus: order.deliveryStatus
  })));

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=export.csv");
  return res.status(200).send(csv);
}));

adminRouter.patch("/users/:id/suspend", requireRole(managerRead), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { accountSuspended: true, accountFlagged: true }
  });

  logger.info("Account suspended", { userId: user.id });
  return ok(res, user, "Account suspended");
}));

adminRouter.patch("/users/:id/unsuspend", requireRole(managerRead), asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { accountSuspended: false, accountFlagged: false }
  });

  logger.info("Account unsuspended", { userId: user.id });
  return ok(res, user, "Account unsuspended");
}));

adminRouter.delete("/users/:id", requireRole(managerRead), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.cartItem.deleteMany({ where: { userId: id } });
    await tx.card.deleteMany({ where: { userId: id } });
    await tx.notification.deleteMany({ where: { userId: id } });
    await tx.deviceLog.deleteMany({ where: { userId: id } });
    await tx.revealLog.deleteMany({ where: { userId: id } });
    await tx.otpCode.deleteMany({ where: { userId: id } });
    await tx.review.deleteMany({ where: { userId: id } });
    await tx.address.deleteMany({ where: { userId: id } });
    await tx.order.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  await prisma.adminActivityLog.create({
    data: {
      actorId: req.user!.id,
      action: "DELETE_USER",
      targetType: "User",
      targetId: id
    }
  });

  logger.info("User deleted", { userId: id });
  return ok(res, null, "User deleted successfully");
}));

adminRouter.get("/audit-logs", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const [deviceLogs, adminLogs] = await Promise.all([
    prisma.deviceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 100
    }),
    prisma.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true } } },
      take: 100
    })
  ]);

  return ok(res, { deviceLogs, adminLogs });
}));

adminRouter.get("/audit-logs/csv", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const [deviceLogs, adminLogs] = await Promise.all([
    prisma.deviceLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true }
    }),
    prisma.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { actor: true }
    })
  ]);

  const rows: any[] = [];

  // Format DeviceLogs
  for (const log of deviceLogs) {
    rows.push({
      date: log.createdAt instanceof Date ? formatLocalDate(log.createdAt) : formatLocalDate(String(log.createdAt)),
      time: log.createdAt instanceof Date ? formatLocalTime(log.createdAt) : formatLocalTime(String(log.createdAt)),
      type: "USER_ACTIVITY",
      actorName: log.user?.name ?? "Guest",
      actorEmail: log.user?.email ?? "",
      action: log.action,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.metadata || ""
    });
  }

  // Format AdminActivityLogs
  for (const log of adminLogs) {
    rows.push({
      date: log.createdAt instanceof Date ? formatLocalDate(log.createdAt) : formatLocalDate(String(log.createdAt)),
      time: log.createdAt instanceof Date ? formatLocalTime(log.createdAt) : formatLocalTime(String(log.createdAt)),
      type: "ADMIN_ACTIVITY",
      actorName: log.actor?.name ?? "System",
      actorEmail: log.actor?.email ?? "",
      action: log.action,
      ipAddress: "N/A",
      userAgent: "N/A",
      details: `Target: ${log.targetType} (ID: ${log.targetId})`
    });
  }

  // Sort merged rows by date & time desc
  rows.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
  return res.status(200).send(csv);
}));

adminRouter.get("/products", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" }
  });
  return ok(res, products);
}));

const productUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    description: z.string().min(5).optional(),
    image: z.string().url().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
    featured: z.boolean().optional(),
    minAmount: z.number().int().positive().optional(),
    maxAmount: z.number().int().positive().optional(),
    type: z.nativeEnum(CardType).optional()
  })
});

adminRouter.patch("/products/:id", requireRole(adminOnly), validate(productUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: req.body
  });

  await prisma.adminActivityLog.create({
    data: {
      actorId: req.user!.id,
      action: "UPDATE_PRODUCT",
      targetType: "Product",
      targetId: updated.id
    }
  });

  return ok(res, updated, "Product updated successfully");
}));

adminRouter.get("/stats", requireRole(managerRead), asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenueResult,
    weeklyRevenueResult,
    monthlyRevenueResult,
    totalCards,
    weeklyCards,
    monthlyCards,
    cardsThisMonth
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.SUCCESS },
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
        createdAt: { gte: sevenDaysAgo }
      },
      _sum: { totalAmount: true }
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.SUCCESS,
        createdAt: { gte: thirtyDaysAgo }
      },
      _sum: { totalAmount: true }
    }),
    prisma.card.count(),
    prisma.card.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    }),
    prisma.card.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.card.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
    })
  ]);

  const totalRevenue = totalRevenueResult._sum.totalAmount ?? 0;
  const weeklyRevenue = weeklyRevenueResult._sum.totalAmount ?? 0;
  const monthlyRevenue = monthlyRevenueResult._sum.totalAmount ?? 0;

  return ok(res, {
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    weeklyRevenue,
    monthlyRevenue,
    totalCards,
    weeklyCards,
    monthlyCards,
    cardsThisMonth
  });
}));
