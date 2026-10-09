import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/app/components/ui/combobox";
import {
  COUNTRY_OPTIONS,
  type CountryOption,
} from "@/authentication/countries";

const matchesCountry = (country: CountryOption, query: string) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return (
    country.name.toLocaleLowerCase().includes(normalizedQuery) ||
    country.code.toLocaleLowerCase().includes(normalizedQuery)
  );
};

const AddressCountryField = ({
  defaultValue,
  serverError,
  onValueChange,
}: {
  defaultValue?: string;
  serverError?: string;
  onValueChange?: () => void;
}) => {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor="address-country" className="block text-sm font-medium">
        Country
      </label>

      <Combobox
        defaultValue={
          COUNTRY_OPTIONS.find((country) => country.code === defaultValue) ??
          null
        }
        items={COUNTRY_OPTIONS}
        name="addressCountry"
        onValueChange={() => onValueChange?.()}
        required
        autoComplete="country"
        autoHighlight
        filter={matchesCountry}
        isItemEqualToValue={(item, value) => item.code === value.code}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.code}
      >
        <ComboboxInput
          id="address-country"
          aria-invalid={Boolean(serverError) || undefined}
          aria-describedby={serverError ? "address-country-error" : undefined}
          placeholder="Select a country"
          className="h-10 w-full"
        />
        <ComboboxContent className="w-[min(22rem,calc(100vw-2rem))] min-w-0">
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(country: CountryOption) => (
              <ComboboxItem key={country.code} value={country}>
                <span
                  aria-hidden="true"
                  className="w-5 shrink-0 text-center text-base"
                >
                  {country.flag}
                </span>
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="text-muted-foreground">{country.code}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {serverError && (
        <p
          id="address-country-error"
          className="text-destructive text-xs wrap-break-word"
          role="alert"
        >
          {serverError}
        </p>
      )}
    </div>
  );
};

export default AddressCountryField;
