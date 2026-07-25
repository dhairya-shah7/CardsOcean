import { CardType, DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../db.js";
import { config } from "../config.js";
import { encrypt } from "../utils/crypto.js";
import { defaultExpiry, generateCardNumber, generateCvv } from "../utils/cards.js";

export async function issueCardsForOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true }
  });

  if (order.paymentStatus !== PaymentStatus.SUCCESS) {
    return order;
  }

  const existingCards = await prisma.card.count({ where: { orderId } });
  if (existingCards > 0) {
    return order;
  }

  for (const item of order.items) {
    const cardPayloads = Array.from({ length: item.quantity }, () => ({
      userId: order.userId,
      productId: item.productId,
      orderId: order.id,
      balanceEncrypted: encrypt(String(item.amount)),
      cardNumberEncrypted: encrypt(generateCardNumber()),
      cvvEncrypted: encrypt(generateCvv()),
      cardType: item.cardType as CardType,
      expiryDate: defaultExpiry()
    }));

    await prisma.card.createMany({ data: cardPayloads });
  }

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: "Cards issued",
      message: "Your prepaid cards are ready to view in the balance dashboard."
    }
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      deliveryStatus: DeliveryStatus.DELIVERED
    }
  });

  return order;
}

export async function simulateSuccessfulPayment(orderId: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.SUCCESS,
      deliveryStatus: DeliveryStatus.PROCESSING
    },
    include: { items: true }
  });

  // Log purchase in DeviceLog for audit logs
  await prisma.deviceLog.create({
    data: {
      userId: order.userId,
      ipAddress: "server",
      userAgent: "system",
      action: "PURCHASE",
      flagged: false,
      metadata: JSON.stringify({
        orderId: order.id,
        amount: order.totalAmount,
        deliveryMethod: order.deliveryMethod,
        itemsCount: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      })
    }
  }).catch(() => undefined);

  await issueCardsForOrder(orderId);
}

