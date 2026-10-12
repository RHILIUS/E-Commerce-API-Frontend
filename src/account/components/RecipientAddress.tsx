import type { RecipientDetails } from "../types";

/** Show the saved address or immutable confirmation snapshot without inferring phone-country location. */
export function RecipientAddress({
  recipient,
}: {
  recipient: RecipientDetails;
}) {
  return (
    <div className="space-y-1 text-sm wrap-anywhere">
      <p className="font-semibold">{recipient.name}</p>
      <p>{recipient.phone_number}</p>
      <p className="text-muted-foreground">
        {[
          recipient.address_line1,
          recipient.address_line2,
          recipient.city,
          recipient.region,
          recipient.postal_code,
          recipient.country_code,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
    </div>
  );
}
