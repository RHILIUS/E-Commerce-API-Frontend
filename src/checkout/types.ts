import type { Money } from "@/ecommerce/cart/types";

export type CheckoutSource =
  | { source: "product"; product_id: number; quantity: number }
  | { source: "cart"; item_ids: number[] };
export type RecipientDetails = {
  name: string;
  phone_number: string;
  country_code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
};
export type Recipient = RecipientDetails & { id: number; is_default: boolean };
export type Preview = {
  source: "product" | "cart";
  currency: string;
  stores: {
    store: { id: number; name: string; profile_image: string | null };
    items: {
      cart_item_id: number | null;
      product: {
        id: number;
        name: string;
        image: {
          image: string;
          alt_text: string;
          crop: Record<string, unknown>;
        } | null;
      };
      quantity: number;
      available_stock: number;
      unit_price: Money | null;
      subtotal: Money | null;
    }[];
    subtotal: Money | null;
  }[];
  total: Money | null;
  can_place_order: boolean;
  issues: {
    code:
      | "product_unavailable"
      | "insufficient_stock"
      | "invalid_price"
      | "amount_too_large";
    product_id: number | null;
    cart_item_id: number | null;
    message: string;
  }[];
  preview_token: string | null;
  expires_at: string | null;
};
export type PlacementRequest = {
  preview_token: string;
  recipient_id: number;
  payment_method: "cod" | "stripe";
  idempotency_key: string;
};
export type Confirmation = {
  reference: string;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
  total: Money;
  orders: {
    id: number;
    store: { id: number; name: string; profile_image: string | null };
    status: string;
    payment_status: string;
    recipient: RecipientDetails;
    subtotal: Money;
    exchange_rate: string;
    exchange_rate_date: string | null;
    items: {
      id: number;
      product_id: number | null;
      name: string;
      image: {
        image: string;
        alt_text: string;
        crop: Record<string, unknown>;
      } | null;
      quantity: number;
      unit_price: Money;
      original_unit_price: Money;
      subtotal: Money;
    }[];
  }[];
};

export type PaymentMethod = "cod" | "stripe";
export type StripePayment = {
  reference: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  checkout_url: string | null;
  expires_at: string | null;
  cancel_requested: boolean;
};
