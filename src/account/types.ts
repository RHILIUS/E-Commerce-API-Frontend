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

export type RecipientInput = Omit<Recipient, "id">;
