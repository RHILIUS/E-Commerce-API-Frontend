/** Decimal strings from the API; currencies are never added together. */
export type Money = { amount: string; currency: string };

export type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    status: "active" | "archived" | "unavailable";
    stock: number;
    can_purchase: boolean;
    image: {
      image: string;
      alt_text: string;
      crop: Record<string, unknown>;
    } | null;
    display_price: Money | null;
  };
  subtotal: Money | null;
};

export type StoreCart = {
  id: number;
  store: { id: number; name: string; profile_image: string | null };
  items: CartItem[];
};

export type CartResponse = { carts: StoreCart[] };
