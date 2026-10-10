import { z } from "zod";

import { ORDER_STATUSES } from "./status";

const orderItemSchema = z
  .object({
    itemTypeId: z.number().int().positive().nullable(),
    customItemName: z.string().trim().min(1).max(200).nullable(),
    serviceId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    isUrgent: z.boolean().default(false),
  })
  .superRefine((item, context) => {
    const hasStandardItem = item.itemTypeId !== null;
    const hasCustomItem = item.customItemName !== null;

    if (hasStandardItem === hasCustomItem) {
      context.addIssue({
        code: "custom",
        message: "Provide either itemTypeId or customItemName.",
      });
    }
  });

export const createOrderSchema = z
  .object({
    source: z.enum(["customer", "kiosk"]),
    customerName: z.string().trim().min(1).max(200).nullable().default(null),
    customerPhone: z.string().trim().min(1).max(30).nullable().default(null),
    pickupAddress: z.string().trim().min(1).max(500).nullable().default(null),
    pickupAt: z.iso.datetime({ offset: true }).nullable().default(null),
    receiptMethod: z.enum(["branch_pickup", "home_delivery"]),
    deliveryAddress: z.string().trim().min(1).max(500).nullable().default(null),
    deliveryAt: z.iso.datetime({ offset: true }).nullable().default(null),
    items: z.array(orderItemSchema).min(1),
  })
  .superRefine((order, context) => {
    if (order.source === "customer" && (!order.pickupAddress || !order.pickupAt)) {
      context.addIssue({
        code: "custom",
        message: "Customer orders require pickupAddress and pickupAt.",
      });
    }

    if (
      order.receiptMethod === "home_delivery" &&
      (!order.deliveryAddress || !order.deliveryAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "Home delivery requires deliveryAddress and deliveryAt.",
      });
    }

    if (
      order.receiptMethod === "branch_pickup" &&
      (order.deliveryAddress !== null || order.deliveryAt !== null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Branch pickup cannot include home delivery fields.",
      });
    }

    if (order.source !== "kiosk" && order.items.some((item) => item.isUrgent)) {
      context.addIssue({
        code: "custom",
        message: "Urgent service is available only for kiosk orders.",
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  receivedByWorkerId: z.number().int().positive().nullable().optional(),
});
