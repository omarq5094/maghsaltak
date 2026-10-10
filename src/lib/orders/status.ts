import statusConfigJson from "../../../shared/order-status-transitions.json";
import statusesJson from "../../../shared/order-statuses.json";

export const ORDER_STATUSES = [
  "جديد",
  "بانتظار الاستلام",
  "تم الاستلام",
  "تحت المعالجة",
  "جاهز",
  "بالتوصيل",
  "تم التسليم",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ReceiptMethod = "branch_pickup" | "home_delivery";

type TransitionConfig = {
  initialStatus: OrderStatus;
  commonTransitions: Partial<Record<OrderStatus, OrderStatus[]>>;
  transitionsByReceiptMethod: Record<
    ReceiptMethod,
    Partial<Record<OrderStatus, OrderStatus[]>>
  >;
  terminalStatuses: OrderStatus[];
};

const listedStatuses = statusesJson as OrderStatus[];
const transitionConfig = statusConfigJson as TransitionConfig;

if (listedStatuses.join("|") !== ORDER_STATUSES.join("|")) {
  throw new Error("Order status JSON does not match the application status type.");
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export function getAllowedTransitions(
  currentStatus: OrderStatus,
  receiptMethod: ReceiptMethod,
): OrderStatus[] {
  return [
    ...(transitionConfig.commonTransitions[currentStatus] ?? []),
    ...(transitionConfig.transitionsByReceiptMethod[receiptMethod][currentStatus] ?? []),
  ];
}

export function isTransitionAllowed(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  receiptMethod: ReceiptMethod,
) {
  return getAllowedTransitions(currentStatus, receiptMethod).includes(nextStatus);
}
