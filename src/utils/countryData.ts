import countriesData from '../../data/github-mledoze-countries/countries.json' with { type: 'json' };
import geonamesGermanData from '../../data/geonames.org/deu.json' with { type: 'json' };

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
export const getCountryGeoJsonPath = (cca3: string): string => `data/countries/${cca3.toLowerCase()}.geo.json`;

// Get the path to a country's SVG flag
export const getCountryFlagPath = (cca3: string): string => `data/countries/${cca3.toLowerCase()}.svg`;

// Get country name and detect which language was actually used
export const getCountryNameWithLanguage = (
    country: CountryData | null,
    preferredLanguage: string = 'deu',
): { name: string; language: string } => {
    if (!country) {
        return { name: '', language: 'eng' };
    }

    // Try translations first
    if (country.translations?.[preferredLanguage]) {
        return {
            name: country.translations[preferredLanguage].common,
            language: preferredLanguage,
        };
    }

    // Fall back to geonames.org data for German
    if (preferredLanguage === 'deu' && country.cca3) {
        const geonamesName = geonamesGermanData.countries[country.cca3 as keyof typeof geonamesGermanData.countries];
        if (geonamesName) {
            return {
                name: geonamesName,
                language: preferredLanguage,
            };
        }
    }

    // Fall back to common name (English)
    return {
        name: country.name.common ?? '',
        language: 'eng',
    };
};

// Get country name in a specific language
export const getCountryName = (country: CountryData | null, language: string = 'deu'): string => {
    return getCountryNameWithLanguage(country, language).name;
};

// Get capital city name and detect which language was actually used
export const getCapitalWithLanguage = (
    country: CountryData | null,
    preferredLanguage: string = 'deu',
): { name: string; language: string } => {
    if (!country) {
        return { name: '', language: 'eng' };
    }

    // For German, try geonames.org data first for better translations
    if (preferredLanguage === 'deu' && country.cca3) {
        const geonamesCapital = geonamesGermanData.capitals[country.cca3 as keyof typeof geonamesGermanData.capitals];
        if (geonamesCapital) {
            return {
                name: geonamesCapital,
                language: preferredLanguage,
            };
        }
    }

    // Fall back to original capital name (typically in native/English)
    return {
        name: country.capital?.[0] || '',
        language: 'eng',
    };
};

// Get capital city name
export const getCapital = (country: CountryData | null, language: string = 'deu'): string => {
    return getCapitalWithLanguage(country, language).name;
};

// Re-export types for convenience
export type { CountryData };
