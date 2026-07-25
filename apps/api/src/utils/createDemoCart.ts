// utils/createDemoCart.ts – creates a simple demo cart for a dev user if empty
import { prisma } from "../db.js";

/**
 * Creates a demo cart item for the given user if they have no cart items.
 * Uses the first available product as the demo product.
 */
export async function createDemoCart(userId: string): Promise<void> {
  // Check if the user already has cart items
  const existing = await prisma.cartItem.findFirst({ where: { userId } });
  if (existing) return;

  // Find any product to add to cart (fallback to the first product)
  const product = await prisma.product.findFirst();
  if (!product) {
    console.warn("[createDemoCart] No products found to create a demo cart.");
    return;
  }

  await prisma.cartItem.create({
    data: {
      userId,
      productId: product.id,
      quantity: 1,
      amount: product.minAmount ?? 1000,
      cardType: product.type,
      savedForLater: false,
    },
  });

  console.log(`[createDemoCart] Demo cart created for user ${userId}`);
}
