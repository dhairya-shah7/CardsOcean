import { prisma } from "./db.js";

async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { id: "442ac7c4-1947-4c4d-b472-3ea4492707c9" } });
    console.log("User:", user);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: "9876543210",
        email: "dhairyaqwerty1@gmail.com",
        panNumber: "ABCDE1234F",
        panVerifiedAt: new Date(),
        panVerificationAttempts: 0,
        panVerificationWindowStartedAt: null,
        panVerificationLockedUntil: null
      }
    });
    console.log("Update succeeded");
  } catch (err: any) {
    console.error("Update failed with error code:", err?.code);
    console.error("Error message:", err?.message);
    console.error("Full error:", err);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error("Outer error:", err);
  process.exit(1);
});
