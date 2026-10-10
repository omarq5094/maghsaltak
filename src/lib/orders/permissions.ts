import type { Actor } from "@/lib/auth/roles";

import { isTransitionAllowed, type OrderStatus, type ReceiptMethod } from "./status";

export type OrderAccessRecord = {
  source: "customer" | "kiosk";
  status: OrderStatus;
  receipt_method: ReceiptMethod;
  customer_user_id: string | null;
  courier_id: number | null;
};

const WORKER_VISIBLE_STATUSES = new Set<OrderStatus>([
  "بانتظار الاستلام",
  "تم الاستلام",
  "تحت المعالجة",
  "جاهز",
]);

const WORKER_TARGET_STATUSES = new Set<OrderStatus>([
  "تم الاستلام",
  "تحت المعالجة",
  "جاهز",
]);

const COURIER_TARGET_STATUSES = new Set<OrderStatus>(["بالتوصيل", "تم التسليم"]);

export function canCreateOrder(actor: Actor, source: "customer" | "kiosk") {
  if (actor.role === "customer") {
    return source === "customer";
  }

  return source === "kiosk" && ["owner", "manager", "worker"].includes(actor.role);
}

export function canReadOrder(actor: Actor, order: OrderAccessRecord) {
  if (actor.role === "owner" || actor.role === "manager") {
    return true;
  }

  if (actor.role === "customer") {
    return order.customer_user_id === actor.userId;
  }

  if (actor.role === "worker") {
    return WORKER_VISIBLE_STATUSES.has(order.status);
  }

  return actor.courierId !== null && order.courier_id === actor.courierId;
}

export function canUpdateOrderStatus(
  actor: Actor,
  order: OrderAccessRecord,
  nextStatus: OrderStatus,
) {
  if (!isTransitionAllowed(order.status, nextStatus, order.receipt_method)) {
    return false;
  }

  if (actor.role === "owner" || actor.role === "manager") {
    return true;
  }

  if (actor.role === "worker") {
    return WORKER_TARGET_STATUSES.has(nextStatus);
  }

  if (actor.role === "courier") {
    return (
      actor.courierId !== null &&
      order.courier_id === actor.courierId &&
      COURIER_TARGET_STATUSES.has(nextStatus)
    );
  }

  return false;
}
