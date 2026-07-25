import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "./src/config.js";

async function main() {
  console.log("DATABASE_URL parsed from config:", config.DATABASE_URL);
  console.log("Connecting to Postgres...");
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
    connectionTimeoutMillis: 5000
  });

  const client = await pool.connect();
  console.log("Connected to pool.");
  client.release();

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL
      }
    }
  });

  console.log("Querying orders count...");
  const orderCount = await prisma.order.count();
  console.log("Total orders in DB:", orderCount);

  console.log("Querying all orders details...");
  const orders = await prisma.order.findMany();
  console.log("Orders in DB:", JSON.stringify(orders, null, 2));

  console.log("Querying stats aggregation...");
  const totalRevenueResult = await prisma.order.aggregate({
    where: { paymentStatus: "SUCCESS" },
    _sum: { totalAmount: true }
  });
  console.log("Aggregation result:", JSON.stringify(totalRevenueResult, null, 2));

  console.log("Querying cards...");
  const cards = await prisma.card.findMany();
  console.log("Cards in DB:", JSON.stringify(cards, null, 2));
}

main().catch(console.error);
