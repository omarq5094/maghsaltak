import { NextResponse } from "next/server";

import { getActor } from "@/lib/auth/actor";
import { ApiError, toErrorResponse } from "@/lib/http/errors";
import { canUpdateOrderStatus, type OrderAccessRecord } from "@/lib/orders/permissions";
import { isOrderStatus, type ReceiptMethod } from "@/lib/orders/status";
import { updateOrderStatusSchema } from "@/lib/orders/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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

    const input = updateOrderStatusSchema.parse(await request.json());
    const admin = createAdminClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("source, status, receipt_method, customer_user_id, courier_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new ApiError(404, "Order not found.");
    }

    if (
      !isOrderStatus(order.status) ||
      (order.receipt_method !== "branch_pickup" && order.receipt_method !== "home_delivery")
    ) {
      throw new ApiError(500, "Order data contains an unsupported state.");
    }

    const accessRecord: OrderAccessRecord = {
      source: order.source,
      status: order.status,
      receipt_method: order.receipt_method as ReceiptMethod,
      customer_user_id: order.customer_user_id,
      courier_id: order.courier_id,
    };

    if (!canUpdateOrderStatus(actor, accessRecord, input.status)) {
      throw new ApiError(403, "This status transition is not allowed for your role.");
    }

    let receivedByWorkerId = input.receivedByWorkerId ?? null;

    if (input.status === "تم الاستلام" && actor.role === "worker") {
      receivedByWorkerId = actor.workerId;
    }

    if (input.status === "تم الاستلام" && receivedByWorkerId === null) {
      throw new ApiError(400, "A worker is required to confirm receipt.");
    }

    const { data, error } = await admin.rpc("transition_order_status", {
      p_order_id: orderId,
      p_next_status: input.status,
      p_changed_by: actor.userId,
      p_received_by_worker_id: receivedByWorkerId,
    });

    if (error) {
      throw new ApiError(400, error.message);
    }

    return NextResponse.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
