import type { Recipient } from "@/account/types";
import type { Confirmation, Preview } from "@/checkout/types";

export const member = {
  id: 1,
  fullName: "Buyer",
  email: "buyer@example.com",
  address_country_code: "PH",
};
export const recipient: Recipient = {
  id: 7,
  name: "Juan Dela Cruz",
  phone_number: "+639123456789",
  country_code: "PH",
  address_line1: "10 Main Street",
  address_line2: "",
  city: "Manila",
  region: "Metro Manila",
  postal_code: "1000",
  is_default: true,
};
export const money = { amount: "240.00", currency: "PHP" };
/** Future-dated previews are generated per test so countdown and expiry checks remain realistic. */
export function preview(): Preview {
  return {
    source: "product",
    currency: "PHP",
    stores: [
      {
        store: { id: 1, name: "Camera Store", profile_image: null },
        items: [
          {
            cart_item_id: null,
            product: { id: 2, name: "Camera", image: null },
            quantity: 2,
            available_stock: 5,
            unit_price: { amount: "120.00", currency: "PHP" },
            subtotal: money,
          },
        ],
        subtotal: money,
      },
    ],
    total: money,
    can_place_order: true,
    issues: [],
    preview_token: "signed-preview",
    expires_at: new Date(Date.now() + 300000).toISOString(),
  };
}
export const confirmation: Confirmation = {
  reference: "78b776ef-6e84-4a64-b70c-5ac73de4a48b",
  status: "completed",
  payment_method: "cod",
  created_at: "2026-10-01T10:00:00Z",
  completed_at: "2026-10-01T10:00:00Z",
  total: money,
  orders: [
    {
      id: 12,
      store: { id: 1, name: "Camera Store", profile_image: null },
      status: "pending",
      payment_status: "unpaid",
      recipient,
      subtotal: money,
      exchange_rate: "1.000000",
      exchange_rate_date: null,
      items: [
        {
          id: 3,
          product_id: 2,
          name: "Camera",
          image: null,
          quantity: 2,
          unit_price: { amount: "120.00", currency: "PHP" },
          original_unit_price: { amount: "120.00", currency: "PHP" },
          subtotal: money,
        },
      ],
    },
  ],
};
