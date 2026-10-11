import type { Confirmation } from "@/checkout/types";
import type { Money } from "@/ecommerce/cart/types";

export const orderTabs = [
  { value: "all", label: "All" },
  { value: "to_ship", label: "To Ship" },
  { value: "to_receive", label: "To Receive" },
  { value: "cancelled", label: "Cancelled" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
] as const;
export type OrderTab = (typeof orderTabs)[number]["value"];
export type OrderStatus =
  | "pending"
  | "accepted"
  | "packed"
  | "shipment_arranged"
  | "shipped"
  | "cancelled"
  | "delivered"
  | "completed";
export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  packed: "Packed",
  shipment_arranged: "Shipment Arranged",
  shipped: "Shipped",
  cancelled: "Cancelled",
  delivered: "Delivered",
  completed: "Completed",
};
export type UserOrder = Omit<Confirmation["orders"][number], "status"> & {
  status: OrderStatus;
  created_at: string;
  concluded_at: string | null;
  checkout_reference: string;
  payment_pending: boolean;
  can_cancel: boolean;
  refund: {
    status: "pending" | "requires_action" | "succeeded" | "failed" | "canceled";
    amount: Money;
    needs_review: boolean;
  } | null;
};
export type OrderPage = {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserOrder[];
};
