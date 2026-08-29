import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

export type CountryOption = {
  callingCode: string;
  code: CountryCode;
  flag: string;
  name: string;
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryNameCollator = new Intl.Collator("en", { sensitivity: "base" });

const getFlagEmoji = (countryCode: CountryCode) =>
  String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    callingCode: getCountryCallingCode(code),
    code,
    flag: getFlagEmoji(code),
    name: regionNames.of(code) ?? code,
  }))
  .sort((first, second) =>
    countryNameCollator.compare(first.name, second.name),
  );

export const DEFAULT_PHONE_COUNTRY =
  COUNTRY_OPTIONS.find(({ code }) => code === "PH") ?? COUNTRY_OPTIONS[0];

export const findCountry = (countryCode: CountryCode) =>
  COUNTRY_OPTIONS.find(({ code }) => code === countryCode);
