/** Catalog presentation data; the future API contract is defined separately. */
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  soldCount: number;
  imageUrl: string;
  imageAlt: string;
};
