import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../utils/responses.js";
import { asyncHandler } from "../utils/async-handler.js";
import PDFDocument from "pdfkit";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get("/", asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      cards: true
    }
  });
  return ok(res, orders);
}));

ordersRouter.get("/:id", asyncHandler(async (req, res) => {
  // Validate ID format to avoid unnecessary DB queries with garbage input
  const id = String(req.params.id);
  if (!id || id.length > 50) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: req.user!.id // Ownership enforced — users can only see their own orders
    },
    include: {
      items: true,
      cards: true,
      address: true
    }
  });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  return ok(res, order);
}));

function buildInvoiceHtml(order: any) {
  const user = order.user;
  const items = order.items || [];
  
  const faceValue = order.giftCardFaceValue || order.subtotalAmount || 0;
  const paymentCharges = Math.round(faceValue * 0.01);
  const platformFee = Math.round(faceValue * 0.02);
  const convenienceCharge = paymentCharges + platformFee;
  const gstAmount = Math.round(convenienceCharge * 0.18);
  const deliveryCharge = order.deliveryMethod === "PHYSICAL" ? 50 : 0;
  const discountAmount = order.discountAmount || 0;
  const totalAmount = order.totalAmount;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #030012; color: #ffffff; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 28px; border: 1px solid #1e1b4b;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00f5d4; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.05em;">Cards Ocean</h1>
        <p style="color: #a1a1aa; margin: 5px 0 0 0; font-size: 14px;">Premium Gift Card Invoice</p>
      </div>

      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 24px; border-radius: 20px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; text-transform: uppercase; color: #a855f7; margin-top: 0; margin-bottom: 15px; letter-spacing: 0.1em;">Order details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Order Reference:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; font-family: monospace;">${order.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Date:</td>
            <td style="padding: 6px 0; text-align: right;">${new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Customer:</td>
            <td style="padding: 6px 0; text-align: right;">${user.name} (${user.email})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Delivery Method:</td>
            <td style="padding: 6px 0; text-align: right; text-transform: uppercase;">${order.deliveryMethod}</td>
          </tr>
          ${order.deliveryMethod === "PHYSICAL" && order.address ? `
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa; vertical-align: top;">Shipping Address:</td>
            <td style="padding: 6px 0; text-align: right;">
              ${order.address.line1}<br/>
              ${order.address.line2 ? `${order.address.line2}<br/>` : ""}
              ${order.address.city}, ${order.address.state} - ${order.address.postalCode}
            </td>
          </tr>
          ` : ""}
        </table>
      </div>

      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 24px; border-radius: 20px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; text-transform: uppercase; color: #a855f7; margin-top: 0; margin-bottom: 15px; letter-spacing: 0.1em;">Items Purchased</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #a1a1aa;">
              <th style="text-align: left; padding-bottom: 10px;">Item Description</th>
              <th style="text-align: center; padding-bottom: 10px;">Qty</th>
              <th style="text-align: right; padding-bottom: 10px;">Price</th>
            </tr>
          </thead>
          <tbody style="color: #e2e8f0;">
            ${items.map((item: any) => `
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 12px 0;">
                  <strong style="color: #ffffff;">${item.title}</strong><br/>
                  <span style="font-size: 12px; color: #a1a1aa;">Type: ${item.cardType}</span>
                </td>
                <td style="text-align: center; padding: 12px 0;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px 0;">₹${item.amount.toLocaleString("en-IN")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 24px; border-radius: 20px;">
        <h2 style="font-size: 16px; text-transform: uppercase; color: #a855f7; margin-top: 0; margin-bottom: 15px; letter-spacing: 0.1em;">Billing Summary</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e2e8f0;">
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Gift Card Face Value:</td>
            <td style="padding: 6px 0; text-align: right;">₹${faceValue.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Payment Charges (1.0%):</td>
            <td style="padding: 6px 0; text-align: right;">₹${paymentCharges.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Platform Fees (2.0%):</td>
            <td style="padding: 6px 0; text-align: right;">₹${platformFee.toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">GST (18% on convenience fee):</td>
            <td style="padding: 6px 0; text-align: right;">₹${gstAmount.toLocaleString("en-IN")}</td>
          </tr>
          ${deliveryCharge > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #a1a1aa;">Physical Delivery Charges:</td>
            <td style="padding: 6px 0; text-align: right;">₹${deliveryCharge.toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
          ${discountAmount > 0 ? `
          <tr style="color: #fbbf24;">
            <td style="padding: 6px 0;">Discount applied:</td>
            <td style="padding: 6px 0; text-align: right;">-₹${discountAmount.toLocaleString("en-IN")}</td>
          </tr>
          ` : ""}
          <tr style="border-top: 1px solid rgba(255, 255, 255, 0.15); font-size: 18px; font-weight: bold; color: #ffffff;">
            <td style="padding: 15px 0 0 0;">Total Amount Paid:</td>
            <td style="padding: 15px 0 0 0; text-align: right; color: #00f5d4;">₹${totalAmount.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; font-size: 12px; color: #64748b;">
        <p>Thank you for choosing Cards Ocean! This is a system-generated invoice.</p>
        <p>© 2026 Cards Ocean Fintech Rails. All rights reserved.</p>
      </div>
    </div>
  `;
}

ordersRouter.post("/:id/invoice/email", asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!id || id.length > 50) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
      address: true
    }
  });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.userId !== req.user!.id && req.user!.role !== "ADMIN" && req.user!.role !== "MANAGER") {
    return res.status(403).json({ success: false, message: "Access Denied: Insufficient permissions to view this invoice" });
  }

  const user = order.user;
  const emailHtml = buildInvoiceHtml(order);

  try {
    const { sendEmail } = await import("../services/mailer.js");
    await sendEmail({
      to: user.email,
      subject: `[Cards Ocean] Invoice for Order #${order.id}`,
      html: emailHtml
    });
    return ok(res, { success: true }, "Invoice emailed successfully");
  } catch (error: any) {
    console.error("Failed to email invoice", error);
    return res.status(500).json({ success: false, message: "Failed to email invoice: " + error.message });
  }
}));

export function generateInvoicePdf(order: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const user = order.user;
    const items = order.items || [];
    const faceValue = order.giftCardFaceValue || order.subtotalAmount || 0;
    const paymentCharges = Math.round(faceValue * 0.01);
    const platformFee = Math.round(faceValue * 0.02);
    const convenienceCharge = paymentCharges + platformFee;
    const gstAmount = Math.round(convenienceCharge * 0.18);
    const deliveryCharge = order.deliveryMethod === "PHYSICAL" ? 50 : 0;
    const discountAmount = order.discountAmount || 0;
    const totalAmount = order.totalAmount;

    // Header
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#000000").text("Cards Ocean", { align: "center" });
    doc.font("Helvetica").fontSize(12).text("Premium Gift Card Invoice", { align: "center" });
    doc.moveDown(2);

    // Order details
    doc.font("Helvetica-Bold").fontSize(14).text("Order Details");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#000000").lineWidth(1).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    doc.text(`Order Reference: ${order.id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`);
    doc.text(`Customer: ${user.name} (${user.email})`);
    doc.text(`Delivery Method: ${order.deliveryMethod}`);

    if (order.deliveryMethod === "PHYSICAL" && order.address) {
      const addr = order.address;
      doc.text(`Shipping Address: ${addr.line1}, ${addr.line2 ? addr.line2 + ", " : ""}${addr.city}, ${addr.state} - ${addr.postalCode}`);
    }
    doc.moveDown(1.5);

    // Items Purchased
    doc.font("Helvetica-Bold").fontSize(14).text("Items Purchased");
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Header
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Item Description", 50, doc.y, { width: 300, continued: true });
    doc.text("Qty", { width: 100, align: "center", continued: true });
    doc.text("Price", { width: 100, align: "right" });
    doc.moveDown(0.5);

    doc.font("Helvetica");
    items.forEach((item: any) => {
      const startY = doc.y;
      const titleText = item.quantity > 1
        ? `${item.title} (Type: ${item.cardType})\n(Rs. ${item.amount.toLocaleString("en-IN")} each)`
        : `${item.title} (Type: ${item.cardType})`;
      const lineTotal = item.amount * item.quantity;

      doc.text(titleText, 50, startY, { width: 300 });
      doc.text(String(item.quantity), 350, startY, { width: 100, align: "center" });
      doc.text(`Rs. ${lineTotal.toLocaleString("en-IN")}`, 450, startY, { width: 100, align: "right" });
      doc.moveDown(0.8);
    });
    doc.moveDown(1);

    // Billing Summary
    doc.font("Helvetica-Bold").fontSize(14).text("Billing Summary", 50);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    
    const writeRow = (label: string, value: string, bold = false) => {
      const startY = doc.y;
      if (bold) doc.font("Helvetica-Bold");
      doc.text(label, 50, startY, { width: 300 });
      doc.text(value, 450, startY, { width: 100, align: "right" });
      if (bold) doc.font("Helvetica");
      doc.moveDown(0.5);
    };

    writeRow("Gift Card Face Value:", `Rs. ${faceValue.toLocaleString("en-IN")}`);
    writeRow("Payment Charges (1.0%):", `Rs. ${paymentCharges.toLocaleString("en-IN")}`);
    writeRow("Platform Fees (2.0%):", `Rs. ${platformFee.toLocaleString("en-IN")}`);
    writeRow("GST (18% on convenience fee):", `Rs. ${gstAmount.toLocaleString("en-IN")}`);
    if (deliveryCharge > 0) {
      writeRow("Physical Delivery Charges:", `Rs. ${deliveryCharge.toLocaleString("en-IN")}`);
    }
    if (discountAmount > 0) {
      writeRow("Discount applied:", `-Rs. ${discountAmount.toLocaleString("en-IN")}`);
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    writeRow("Total Amount Paid:", `Rs. ${totalAmount.toLocaleString("en-IN")}`, true);

    doc.moveDown(2);
    doc.font("Helvetica").fontSize(9);
    doc.text("Thank you for choosing Cards Ocean! This is a system-generated invoice.", { align: "center" });
    doc.text("© 2026 Cards Ocean Fintech Rails. All rights reserved.", { align: "center" });

    doc.end();
  });
}

ordersRouter.get("/:id/invoice/download", asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!id || id.length > 50) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
      address: true
    }
  });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.userId !== req.user!.id && req.user!.role !== "ADMIN" && req.user!.role !== "MANAGER") {
    return res.status(403).json({ success: false, message: "Access Denied: Insufficient permissions to view this invoice" });
  }

  try {
    const pdfBuffer = await generateInvoicePdf(order);
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.id}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error("Failed to generate PDF", err);
    return res.status(500).json({ success: false, message: "Failed to generate PDF invoice" });
  }
}));
