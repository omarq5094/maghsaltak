import { NextResponse } from "next/server";

import { getActor } from "@/lib/auth/actor";
import { ApiError, toErrorResponse } from "@/lib/http/errors";
import { canCreateOrder } from "@/lib/orders/permissions";
import { createOrderSchema } from "@/lib/orders/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const actor = await getActor();

    if (!actor) {
      throw new ApiError(401, "Authentication is required.");
    }

    const input = createOrderSchema.parse(await request.json());

    if (!canCreateOrder(actor, input.source)) {
      throw new ApiError(403, "You cannot create this order source.");
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("create_order_with_items", {
      p_source: input.source,
      p_customer_user_id: input.source === "customer" ? actor.userId : null,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_pickup_address: input.pickupAddress,
      p_pickup_at: input.pickupAt,
      p_receipt_method: input.receiptMethod,
      p_delivery_address: input.deliveryAddress,
      p_delivery_at: input.deliveryAt,
      p_items: input.items,
      p_created_by: actor.userId,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
