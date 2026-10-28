import nodemailer from "nodemailer";
import { formatINR } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendReceipt(order: any) {
  const html = `<div style="font-family:Arial;background:#0B0B0B;color:#F5F5F5;padding:24px">
    <h2>Thank you for your order</h2>
    <p>Order <b>${order.customOrderId}</b> is confirmed and our tailors have been notified.</p>
    <table style="width:100%;border-collapse:collapse">${order.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((i: any) => `<tr><td>${i.title} (${i.selectedVariant.color}, ${i.selectedVariant.size}) × ${i.quantity}</td><td align="right">${formatINR(i.totalItemPrice)}</td></tr>`)
      .join("")}</table>
    <p><b>Total paid: ${formatINR(order.pricingSummary.grandTotal)}</b></p>
    <p>Track it any time at ${process.env.NEXT_PUBLIC_SITE_URL}/track-order</p></div>`;
  if (!process.env.SMTP_HOST) {
    console.log(`[mail] SMTP not configured – receipt for ${order.customOrderId} → ${order.customer.email}`);
    return;
  }
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await t.sendMail({ from: process.env.MAIL_FROM, to: order.customer.email, subject: `Order ${order.customOrderId} confirmed`, html });
}
