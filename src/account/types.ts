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

export type ProfileAddress = {
  country_code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
};
export type ProfileInput = {
  full_name: string;
  phone_number: string;
  address: ProfileAddress;
};
export type Profile = Omit<ProfileInput, "address"> & {
  id: number;
  username: string;
  email: string;
  address: ProfileAddress | null;
  profile_image: string | null;
  profile_image_crop: Record<string, unknown>;
};
