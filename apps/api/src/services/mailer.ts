function resolveFromAddress() {
  const customFrom = process.env.RESEND_FROM_EMAIL || process.env.SENDER_EMAIL;
  if (customFrom) {
    const domain = customFrom.split("@")[1]?.toLowerCase();
    const publicDomains = [
      "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
      "aol.com", "zoho.com", "proton.me", "protonmail.com",
      "mail.com", "yandex.com", "live.com", "icloud.com"
    ];
    if (domain && publicDomains.includes(domain) && process.env.RESEND_API_KEY) {
      return "onboarding@resend.dev";
    }
    return customFrom;
  }
  return `no-reply@${process.env.FRONTEND_URL?.replace(/^https?:\/\//, "") || "localhost"}`;
}

async function sendViaResend(params: { to: string; subject: string; html: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return false;
  }

  const from = resolveFromAddress();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return true;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    if (await sendViaResend(params)) {
      return true;
    }
    if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
      throw new Error("Email delivery is not configured. Set RESEND_API_KEY or SMTP_HOST.");
    }
    console.warn("Resend is not configured; email was not delivered.");
  } catch (err) {
    console.error("Resend send failed, falling back:", err);
  }

  // Nodemailer fallback when SMTP config is provided
  if (process.env.SMTP_HOST) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: resolveFromAddress(),
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      return true;
    } catch (err) {
      console.error("SMTP send failed, falling back to console:", err);
    }
  }

  // Final fallback: log to console (useful for local dev)
  console.log("Email placeholder", params.to, params.subject);
  return false;
}

export async function sendSms(params: { to: string; message: string }) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioSid && twilioToken) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const Twilio = await import("twilio");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const client = new Twilio.default(twilioSid, twilioToken);
      await client.messages.create({
        from: process.env.TWILIO_FROM || undefined,
        to: params.to,
        body: params.message,
      });
      return;
    } catch (err) {
      console.error("Twilio send failed, falling back:", err);
    }
  }

  // Final fallback: log to console
  console.log("SMS placeholder", params.to, params.message);
}
