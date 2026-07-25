import { Router } from "express";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { revealLimiter } from "../middleware/rate-limits.js";
import { validate } from "../middleware/validate.js";
import { revealSchema } from "../schemas/cards.js";
import { decrypt, maskCardNumber } from "../utils/crypto.js";
import { ok } from "../utils/responses.js";
import { asyncHandler } from "../utils/async-handler.js";

export const cardsRouter = Router();

cardsRouter.use(requireAuth);

cardsRouter.get("/", asyncHandler(async (req, res) => {
  const cards = await prisma.card.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: true,
      transactions: true
    }
  });

  const result = cards.map((card: any) => {
    const cardNumber = decrypt(card.cardNumberEncrypted);
    return {
      ...card,
      cardNumberMasked: maskCardNumber(cardNumber),
      balance: Number(decrypt(card.balanceEncrypted)),
      // Strip all encrypted fields from API response — never send encrypted blobs to client
      cardNumberEncrypted: undefined,
      balanceEncrypted: undefined,
      cvvEncrypted: undefined
    };
  });

  return ok(res, result);
}));

cardsRouter.post("/:id/reveal", revealLimiter, validate(revealSchema), asyncHandler(async (req, res) => {
  const cardId = String(req.params.id);

  // Ownership check — users can only reveal their own cards
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      userId: req.user!.id
    }
  });

  if (!card) {
    // Return 404 (not 403) to avoid confirming the card exists for other users
    return res.status(404).json({ success: false, message: "Card not found" });
  }

  if (card.revealCount >= config.CARD_REVEAL_LIMIT) {
    return res.status(403).json({ success: false, message: "Reveal limit reached" });
  }

  const decrypted = {
    cardNumber: decrypt(card.cardNumberEncrypted),
    cvv: decrypt(card.cvvEncrypted),
    balance: Number(decrypt(card.balanceEncrypted))
  };

  // Atomic transaction — log + increment together so they can't diverge
  await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: {
        revealCount: { increment: 1 },
        lastRevealedAt: new Date()
      }
    }),
    prisma.revealLog.create({
      data: {
        userId: req.user!.id,
        cardId: card.id,
        ipAddress: req.ip || "unknown"
      }
    })
  ]);

  return ok(res, {
    ...decrypted,
    expiryDate: card.expiryDate,
    revealCountRemaining: Math.max(config.CARD_REVEAL_LIMIT - card.revealCount - 1, 0)
  }, "Card revealed");
}));
