import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Order, FULFILLMENT_STATUSES } from "@/models/Order";

const schema = z.object({
  status: z.enum(FULFILLMENT_STATUSES),
  courierPartner: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  await connectDB();
  const order = await Order.findById(params.id).lean();
  return order ? NextResponse.json({ order }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Pushes a status change + tracking info; appends to the customer-visible timeline. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin(); if (denied) return denied;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
  const { status, courierPartner, trackingNumber, trackingUrl, note } = parsed.data;
  await connectDB();
  const order = await Order.findByIdAndUpdate(
    params.id,
    {
      $set: {
        "fulfillment.status": status,
        ...(courierPartner !== undefined && { "fulfillment.courierPartner": courierPartner }),
        ...(trackingNumber !== undefined && { "fulfillment.trackingNumber": trackingNumber }),
        ...(trackingUrl !== undefined && { "fulfillment.trackingUrl": trackingUrl }),
      },
      $push: { "fulfillment.timeline": { status, timestamp: new Date(), note: note ?? "" } },
    },
    { new: true }
  );
  return order ? NextResponse.json({ order }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
