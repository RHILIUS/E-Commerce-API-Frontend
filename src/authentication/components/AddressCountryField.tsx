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

const AddressCountryField = () => {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor="address-country" className="block text-sm font-medium">
        Country
      </label>

      <Combobox
        items={COUNTRY_OPTIONS}
        name="addressCountry"
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
    </div>
  );
};

export default AddressCountryField;
