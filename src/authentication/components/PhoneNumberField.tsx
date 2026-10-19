import {
  AsYouType,
  getExampleNumber,
  isValidPhoneNumber,
  parseDigits,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import phoneExamples from "libphonenumber-js/mobile/examples";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/app/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/app/components/ui/input-group";
import {
  COUNTRY_OPTIONS,
  type CountryOption,
  DEFAULT_PHONE_COUNTRY,
  findCountry,
} from "@/authentication/countries";

type CountryFlagProps = {
  country: CountryOption;
};

const CountryFlag = ({ country }: CountryFlagProps) => {
  return (
    <span aria-hidden="true" className="w-5 shrink-0 text-center text-base">
      {country.flag}
    </span>
  );
};

const PhoneNumberField = ({
  defaultValue,
  serverError,
  onValueChange,
}: {
  defaultValue?: string;
  serverError?: string;
  onValueChange?: () => void;
}) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const initialPhone = defaultValue
    ? parsePhoneNumberFromString(defaultValue)
    : undefined;
  // Non-geographic E.164 numbers have no country selector entry; edit the full number.
  const internationalOnly = Boolean(initialPhone && !initialPhone.country);
  const [country, setCountry] = useState(() =>
    initialPhone?.country
      ? (findCountry(initialPhone.country) ?? DEFAULT_PHONE_COUNTRY)
      : DEFAULT_PHONE_COUNTRY,
  );
  const [nationalNumber, setNationalNumber] = useState(
    internationalOnly
      ? (initialPhone?.number ?? "")
      : (initialPhone?.nationalNumber ?? ""),
  );
  const [hasBlurred, setHasBlurred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedNationalNumber = useMemo(
    () =>
      internationalOnly
        ? nationalNumber
        : new AsYouType(country.code).input(nationalNumber),
    [country.code, internationalOnly, nationalNumber],
  );

  const internationalNumber = useMemo(() => {
    if (internationalOnly) return nationalNumber.trim();
    if (!nationalNumber) {
      return "";
    }

    return (
      parsePhoneNumberFromString(nationalNumber, country.code)?.number ??
      `+${country.callingCode}${nationalNumber}`
    );
  }, [country, internationalOnly, nationalNumber]);

  const hasInvalidNumber =
    nationalNumber.length > 0 &&
    !isValidPhoneNumber(
      nationalNumber,
      internationalOnly ? undefined : country.code,
    );
  const invalidMessage = internationalOnly
    ? "Enter a valid international phone number."
    : `Enter a valid phone number for ${country.name}.`;
  const isInvalid = Boolean(serverError) || (hasBlurred && hasInvalidNumber);

  useEffect(() => {
    inputRef.current?.setCustomValidity(hasInvalidNumber ? invalidMessage : "");
  }, [hasInvalidNumber, invalidMessage]);

  const handleNumberChange = (value: string) => {
    onValueChange?.();
    if (internationalOnly) {
      setNationalNumber(value);
      return;
    }
    if (value.trimStart().startsWith("+")) {
      const parsedNumber = parsePhoneNumberFromString(value);
      const parsedCountry = parsedNumber?.country
        ? findCountry(parsedNumber.country)
        : undefined;

      if (parsedNumber && parsedCountry) {
        setCountry(parsedCountry);
        setNationalNumber(parsedNumber.nationalNumber);

        return;
      }
    }

    setNationalNumber(parseDigits(value));
  };

  const handleCountryChange = (nextCountry: CountryOption | null) => {
    if (nextCountry) {
      onValueChange?.();
      setCountry(nextCountry);
    }
  };

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        Phone number
      </label>

      <Combobox
        items={COUNTRY_OPTIONS}
        value={country}
        onValueChange={handleCountryChange}
        autoHighlight
        isItemEqualToValue={(item, value) => item.code === value.code}
        itemToStringLabel={(item) =>
          `${item.name} ${item.code} +${item.callingCode}`
        }
        itemToStringValue={(item) => item.code}
      >
        <InputGroup className="h-10 overflow-hidden">
          <InputGroupInput
            ref={inputRef}
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete={internationalOnly ? "tel" : "tel-national"}
            placeholder={
              internationalOnly
                ? "+800 12345678"
                : (getExampleNumber(
                    country.code,
                    phoneExamples,
                  )?.formatNational() ?? "National phone number")
            }
            value={formattedNationalNumber}
            onChange={(event) => handleNumberChange(event.currentTarget.value)}
            onBlur={() => setHasBlurred(true)}
            onInvalid={() => setHasBlurred(true)}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? errorId : undefined}
            className="h-10 min-w-0 px-3 text-base md:text-sm"
            required
          />

          {!internationalOnly && (
            <InputGroupAddon
              align="inline-start"
              className="border-input text-foreground h-full border-r p-0 has-[>button]:m-0"
            >
              <ComboboxTrigger
                aria-label={`Phone country: ${country.name}, +${country.callingCode}`}
                className="hover:bg-muted/50 focus-visible:bg-muted/50 data-popup-open:bg-muted/50 flex h-full w-26 items-center gap-1.5 px-2.5 text-sm outline-none"
              >
                <CountryFlag country={country} />
                <span>+{country.callingCode}</span>
              </ComboboxTrigger>
            </InputGroupAddon>
          )}
        </InputGroup>

        <ComboboxContent className="w-[min(22rem,calc(100vw-2rem))] min-w-0">
          <ComboboxInput
            placeholder="Search country or calling code"
            showTrigger={false}
            className="w-auto"
          />
          <ComboboxEmpty>No countries found.</ComboboxEmpty>
          <ComboboxList>
            {(item: CountryOption) => (
              <ComboboxItem key={item.code} value={item}>
                <CountryFlag country={item} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-muted-foreground">
                  +{item.callingCode}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <input type="hidden" name="phoneCountry" value={country.code} />
      <input
        type="hidden"
        name="phoneCallingCode"
        value={`+${country.callingCode}`}
      />
      <input type="hidden" name="phoneNumber" value={internationalNumber} />

      {isInvalid && (
        <p
          id={errorId}
          className="text-destructive text-xs wrap-break-word"
          role="alert"
        >
          {serverError || invalidMessage}
        </p>
      )}
    </div>
  );
};

export default PhoneNumberField;
