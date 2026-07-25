import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { CardType, Role, ProductStatus, PaymentStatus, DeliveryStatus } from "@prisma/client";
import { prisma } from "../src/db.js";

async function main() {
  const password = await bcrypt.hash("Password@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "dhairyaqwerty1@gmail.com" },
    update: {},
    create: {
      name: "Dhairya",
      email: "dhairyaqwerty1@gmail.com",
      password,
      verified: true,
      role: Role.ADMIN
    }
  });

  const seller = await prisma.user.upsert({
    where: { email: "rugs1007@gmail.com" },
    update: {},
    create: {
      name: "Rugved Thakar",
      email: "rugs1007@gmail.com",
      password,
      verified: true,
      role: Role.ADMIN,
      sellerProfile: {
        create: {
          displayName: "Luxe Card Studio"
        }
      }
    }
  });

  const user = admin; // Re-use Dhairya for the seeded buyer orders and relationships

  const products = [
    {
      id: "4e0c7b6a-2f6d-4d4d-9d4f-3f1c8b0d1a01",
      slug: "aurora-signature",
      title: "Aurora Signature Card",
      subtitle: "A premium virtual card built for elegant gifting.",
      description: "Designed for instant gifting, encrypted delivery, and custom amount control from checkout to reveal.",
      type: CardType.VIRTUAL,
      verified: true,
      featured: true,
      trendingScore: 100,
      image: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    },
    {
      id: "7d2ef4a0-7d7d-4a49-8d3f-6d7e5b8f2b02",
      slug: "ember-physical",
      title: "Ember Physical Card",
      subtitle: "A tactile premium card with gift-ready presentation.",
      description: "A physical-first option with the same encrypted fulfillment and trust signals as the digital experience.",
      type: CardType.PHYSICAL,
      verified: true,
      featured: true,
      trendingScore: 90,
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    },
    {
      id: "0c2e5a8f-5f3d-4d2b-9c8f-4f6f6d9c3c03",
      slug: "lumen-gift-collective",
      title: "Lumen Gift Collective",
      subtitle: "A flexible collection for corporate and personal gifting.",
      description: "Built for premium gifting moments when you need a polished storefront even before the live catalog is populated.",
      type: CardType.VIRTUAL,
      verified: false,
      featured: false,
      trendingScore: 80,
      image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    },
    {
      id: "9b7f3c1e-1f2d-4f7f-8a8a-1a2b3c4d5e04",
      slug: "noir-premium",
      title: "Noir Premium Card",
      subtitle: "Dark, minimal, and built for high-trust checkout flows.",
      description: "A minimal showcase card that keeps the storefront visually complete when the backend catalog is empty.",
      type: CardType.PHYSICAL,
      verified: false,
      featured: false,
      trendingScore: 70,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    },
    {
      id: "c1a4d8e9-3b6f-4f01-8d22-9e4c7a8b0f05",
      slug: "verve-instant",
      title: "Verve Instant Card",
      subtitle: "Quick to buy, quick to reveal, and easy to trust.",
      description: "A polished fallback for the product grid that preserves the luxury look and feel of the storefront.",
      type: CardType.VIRTUAL,
      verified: true,
      featured: false,
      trendingScore: 60,
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    },
    {
      id: "f0e1d2c3-b4a5-4c6d-8e7f-102938475606",
      slug: "velvet-collector",
      title: "Velvet Collector Card",
      subtitle: "A high-end gift card concept with boutique energy.",
      description: "A sixth card to keep the trending section visually balanced until real catalog data is available.",
      type: CardType.PHYSICAL,
      verified: false,
      featured: false,
      trendingScore: 50,
      image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      gallery: []
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: {
        ...product,
        minAmount: 1000,
        maxAmount: 10000,
        sellerId: seller.id,
        status: ProductStatus.APPROVED
      }
    });
  }

  const firstProduct = await prisma.product.findUniqueOrThrow({
    where: { slug: "aurora-signature" }
  });

  const existingOrder = await prisma.order.findFirst({
    where: { userId: user.id }
  });

  if (!existingOrder) {
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        subtotalAmount: 2500,
        totalAmount: 2500,
        paymentStatus: PaymentStatus.SUCCESS,
        deliveryStatus: DeliveryStatus.DELIVERED,
        emailVerified: true,
        smsVerified: true,
        captchaVerified: true,
        items: {
          create: {
            productId: firstProduct.id,
            quantity: 1,
            amount: 2500,
            title: firstProduct.title,
            cardType: firstProduct.type
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Order delivered",
        message: "Your premium gift card is now available in the balance dashboard."
      }
    });

    await prisma.review.create({
      data: {
        userId: user.id,
        productId: firstProduct.id,
        rating: 5,
        title: "Smooth checkout",
        message: "The gifting flow felt premium and the card arrived instantly."
      }
    });

    console.log(`Seeded demo order ${order.id}`);
  }

  console.log({
    admin: admin.email,
    seller: seller.email,
    user: user.email,
    password: "Password@123"
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
