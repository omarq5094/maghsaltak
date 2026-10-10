import { NextResponse } from "next/server";

import { getActor } from "@/lib/auth/actor";
import { ApiError, toErrorResponse } from "@/lib/http/errors";
import { canReadOrder, type OrderAccessRecord } from "@/lib/orders/permissions";
import { isOrderStatus, type ReceiptMethod } from "@/lib/orders/status";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actor = await getActor();

    if (!actor) {
      throw new ApiError(401, "Authentication is required.");
    }

    const { id: rawId } = await context.params;
    const orderId = Number(rawId);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      throw new ApiError(400, "Invalid order id.");
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*, order_items(*), order_status_history(*)")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      throw new ApiError(404, "Order not found.");
    }

    if (
      !isOrderStatus(data.status) ||
      (data.receipt_method !== "branch_pickup" && data.receipt_method !== "home_delivery")
    ) {
      throw new ApiError(500, "Order data contains an unsupported state.");
    }

    const accessRecord: OrderAccessRecord = {
      source: data.source,
      status: data.status,
      receipt_method: data.receipt_method as ReceiptMethod,
      customer_user_id: data.customer_user_id,
      courier_id: data.courier_id,
    };

    if (!canReadOrder(actor, accessRecord)) {
      throw new ApiError(403, "You cannot view this order.");
    }

    if (actor.role === "courier") {
      const visibleItems = (data.order_items ?? []).map(
        ({ unit_price: _unitPrice, ...item }: { unit_price: number | null; [key: string]: unknown }) =>
          item,
      );

      return NextResponse.json({
        id: data.id,
        status: data.status,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        pickup_address: data.pickup_address,
        delivery_address: data.delivery_address,
        receipt_method: data.receipt_method,
        order_items: visibleItems,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
