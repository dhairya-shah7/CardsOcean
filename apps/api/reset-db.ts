import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { config } from "./src/config.js";

async function main() {
  console.log("Connecting to PostgreSQL...");
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL
  });

  const client = await pool.connect();
  client.release();

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL
      }
    }
  });

  console.log("Starting database reset...");

  // 1. Delete all reviews
  const deletedReviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${deletedReviews.count} reviews.`);

  // 2. Delete all users except the 2 admins
  const adminEmails = ["rugs1007@gmail.com", "dhairyaqwerty1@gmail.com"];
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: adminEmails
      }
    }
  });
  console.log(`Deleted ${deletedUsers.count} users.`);

  // 3. Recreate or update the two admin users (do NOT verify PAN)
  for (const email of adminEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: {
          role: "ADMIN",
          verified: true
        }
      });
      console.log(`Updated admin: ${email} (PAN verification preserved for manual test)`);
    } else {
      const hashedPassword = await bcrypt.hash("adminpassword123", 12);
      await prisma.user.create({
        data: {
          name: email.split("@")[0],
          email: email,
          password: hashedPassword,
          role: "ADMIN",
          verified: true
        }
      });
      console.log(`Created new admin: ${email} with password "adminpassword123"`);
    }
  }

  await pool.end();
  console.log("Database reset complete!");
}

main().catch(console.error);
