import countriesData from "../../data/countries/countries.json";
import type { CountryData } from "../types/country";

export const getAllCountries = (): CountryData[] => {
    return countriesData as unknown as CountryData[];
};

// Get African countries
export const getAfricanCountries = (): CountryData[] => {
    return getAllCountries().filter(
        (country) =>
            country.region === "Africa" ||
            country.continents?.includes("Africa")
    );
};

// Get country by cca3 code
export const getCountryByCca3 = (cca3: string): CountryData | undefined => {
    return getAllCountries().find((country) => country.cca3 === cca3);
};

// Get the path to a country's GeoJSON file
export const getCountryGeoJsonPath = (cca3: string): string => {
    return `/data/countries/data/${cca3.toLowerCase()}.geo.json`;
};

// Get the path to a country's SVG flag
export const getCountryFlagPath = (cca3: string): string => {
    return `/data/countries/data/${cca3.toLowerCase()}.svg`;
};

// Get country name in a specific language
export const getCountryName = (
    country: CountryData,
    language: string = "de"
): string => {
    // Try translations first
    if (country.translations?.[language]) {
        return country.translations[language].common;
    }

    // Fall back to common name
    return country.name.common;
};

// Get capital city name
export const getCapital = (country: CountryData): string => {
    return country.capital?.[0] || "";
};

// Re-export types for convenience
export type { Country, CountryData } from "../types/country";
