import { Button } from "@/app/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/app/components/ui/combobox";

import { useDisplayCurrency } from "./context";

type Choice = { code: string; label: string };

/** Search supported browsing currencies and return focus to the header after selection. */
export function CurrencySelector() {
  const preference = useDisplayCurrency();
  const choices: Choice[] = [
    {
      code: "",
      label: `Automatic${preference.defaultCurrency ? ` (${preference.defaultCurrency})` : ""}`,
    },
    ...preference.options.map((item) => ({
      code: item.code,
      label: `${item.code} — ${item.name}`,
    })),
  ];
  const selected = choices.find(
    (item) => item.code === (preference.currency ?? ""),
  )!;
  return (
    <Combobox
      items={choices}
      value={selected}
      onValueChange={(choice) => {
        if (choice) preference.select(choice.code || undefined);
      }}
      isItemEqualToValue={(item, value) => item.code === value.code}
      itemToStringLabel={(item) => item.label}
      autoHighlight
    >
      <ComboboxTrigger
        render={
          <Button
            variant="ghost"
            className="h-11 gap-1 rounded-lg px-0.5 text-xs min-[375px]:px-1.5 sm:px-2 sm:text-sm"
          />
        }
        aria-label={`Display currency: ${preference.currency ?? preference.defaultCurrency ?? "Automatic"}`}
      >
        {preference.currency ?? preference.defaultCurrency ?? "Auto"}
      </ComboboxTrigger>
      <ComboboxContent
        align="start"
        className="w-[min(21rem,calc(100vw-2rem))] min-w-64"
      >
        <p className="px-3 pt-3 text-sm font-medium">Display currency</p>
        <p className="text-muted-foreground px-3 pt-1 pb-2 text-xs">
          Browsing estimates. Checkout confirms the payment currency.
        </p>
        <ComboboxInput
          aria-label="Search currencies"
          placeholder="Search currencies"
          showTrigger={false}
        />
        {preference.loading && (
          <p role="status" className="text-muted-foreground px-3 py-2 text-xs">
            Loading currencies…
          </p>
        )}
        {preference.error && (
          <div role="alert" className="px-3 py-2 text-sm">
            Couldn't load currency options.{" "}
            <Button variant="link" onClick={preference.retry}>
              Try again
            </Button>
          </div>
        )}
        {preference.storageError && (
          <p role="status" className="text-muted-foreground px-3 py-2 text-xs">
            Selected for this visit. Your browser couldn't save the preference.
          </p>
        )}
        <ComboboxEmpty>No currencies found.</ComboboxEmpty>
        <ComboboxList>
          {(choice: Choice) => (
            <ComboboxItem
              key={choice.code}
              value={choice}
              className="min-h-11 px-3 pr-8"
            >
              {choice.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
