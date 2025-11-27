import countriesData from '../../data/countries/countries.json' with { type: 'json' };

import type { CountryData, Region } from '../types/countries-json.js';

export const getAllCountries = (): CountryData[] => {
    return countriesData as unknown as CountryData[];
};

// Get countries by Region
export const getCountriesByRegion = (region: Region): CountryData[] =>
    getAllCountries().filter((country) => country.region === region && country.cca3 !== 'UNK');

// Get country by cca3 code
export const getCountryByCca3 = (cca3: string): CountryData | undefined =>
    getAllCountries().find((country) => country.cca3 === cca3);

// Get the path to a country's GeoJSON file
export const getCountryGeoJsonPath = (cca3: string): string => `data/countries/data/${cca3.toLowerCase()}.geo.json`;

// Get the path to a country's SVG flag
export const getCountryFlagPath = (cca3: string): string => `data/countries/data/${cca3.toLowerCase()}.svg`;

// Get country name in a specific language
export const getCountryName = (country: CountryData | null, language: string = 'deu'): string => {
    // Try translations first
    if (country?.translations?.[language]) {
        return country.translations[language].common;
    }

    // Fall back to common name
    return country?.name.common ?? '';
};

// Get country name and detect which language was actually used
export const getCountryNameWithLanguage = (
    country: CountryData | null,
    preferredLanguage: string = 'deu',
): { name: string; language: string } => {
    // Try translations first
    if (country?.translations?.[preferredLanguage]) {
        return {
            name: country.translations[preferredLanguage].common,
            language: preferredLanguage,
        };
    }

    // Fall back to common name (English)
    return {
        name: country?.name.common ?? '',
        language: 'eng',
    };
};

// Get capital city name
export const getCapital = (country: CountryData | null): string => {
    return country?.capital?.[0] || '';
};

// Re-export types for convenience
export type { CountryData };
