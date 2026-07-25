import { prisma } from "../db.js";

/**
 * Creates a demo cart for the given user.
 * This is used in development environments when a user's cart is empty.
 * It selects a few approved products and adds them to the user's cart.
 */
export async function createDemoCart(userId) {
  try {
    // Fetch a small set of approved products to use as demo items.
    const demoProducts = await prisma.product.findMany({
      where: { status: "APPROVED" },
      take: 3,
    });

    if (!demoProducts.length) {
      console.warn("[createDemoCart] No approved products found for demo cart.");
      return;
    }

    const cartItems = demoProducts.map((product) => ({
      userId,
      productId: product.id,
      quantity: 1,
      amount: product.minAmount ?? 1000,
      cardType: product.type,
    }));

    // Insert cart items using createMany with skipDuplicates if supported.
    await prisma.cartItem.createMany({
      data: cartItems,
      skipDuplicates: true,
    });

    console.log(`[createDemoCart] Created demo cart for user ${userId}`);
  } catch (err) {
    console.error("[createDemoCart] Error creating demo cart:", err);
  }
}
