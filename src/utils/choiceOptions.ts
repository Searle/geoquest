import { shuffleArray } from './arrayUtils.js';
import type { CountryData } from './countryData.js';
import { getCountryName } from './countryData.js';

/**
 * Generates multiple choice country options for a quiz question
 * @param correctCountry The country that is the correct answer
 * @param allCountries All countries in the current region
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @param filterFn Optional function to filter valid countries (e.g., must have a capital)
 * @returns Array of shuffled CountryData objects (1 correct + N wrong)
 */
export function getCountryDataOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
    filterFn?: (country: CountryData) => boolean,
): CountryData[] {
    // Filter out the correct country, countries answered correctly, and apply optional filter
    const otherCountries = allCountries.filter((country) => {
        const isValidOption = country.cca3 !== correctCountry.cca3;
        const notAnsweredCorrectly = !answeredCorrectly || !answeredCorrectly.has(country.cca3);
        const passesFilter = !filterFn || filterFn(country);
        return isValidOption && notAnsweredCorrectly && passesFilter;
    });

    // Determine the actual number of wrong answers we can provide
    const actualWrongAnswerCount = Math.min(wrongAnswerCount, otherCountries.length);

    // Take first N countries as wrong answers
    const wrongCountries = shuffleArray(otherCountries).slice(0, actualWrongAnswerCount);

    // Combine correct and wrong answers
    return shuffleArray([correctCountry, ...wrongCountries]);
}

/**
 * Generates multiple choice options for a quiz question
 * @param correctCountry The country that is the correct answer
 * @param allCountries All countries in the current region
 * @param extractValue Function to extract the display value from a country (e.g., capital or country name)
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @returns Array of shuffled option strings (1 correct + N wrong)
 */
function getQuizOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    extractValue: (country: CountryData) => string | undefined,
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
): string[] {
    const correctValue = extractValue(correctCountry) || '';

    // Filter out the correct country, countries without valid values, and countries answered correctly
    const otherCountries = allCountries.filter((country) => {
        const value = extractValue(country);
        const isValidOption = country.cca3 !== correctCountry.cca3 && value && value.length > 0;
        const notAnsweredCorrectly = !answeredCorrectly || !answeredCorrectly.has(country.cca3);
        return isValidOption && notAnsweredCorrectly;
    });

    // Determine the actual number of wrong answers we can provide
    const actualWrongAnswerCount = Math.min(wrongAnswerCount, otherCountries.length);

    // Take first N values as wrong answers
    const wrongValues = shuffleArray(otherCountries)
        .slice(0, actualWrongAnswerCount)
        .map((country) => extractValue(country)!);

    // Combine correct and wrong answers
    return shuffleArray([correctValue, ...wrongValues]);
}

/**
 * Generates multiple choice options for a capital quiz question
 * @param correctCountry The country whose capital is the correct answer
 * @param allCountries All countries in the current region
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @returns Array of shuffled capital names (1 correct + N wrong)
 */
export function getCapitalOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
): string[] {
    return getQuizOptions(
        correctCountry,
        allCountries,
        (country) => country.capital?.[0],
        wrongAnswerCount,
        answeredCorrectly,
    );
}

/**
 * Generates multiple choice options for a country quiz question
 * @param correctCountry The country that is the correct answer
 * @param allCountries All countries in the current region
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @returns Array of shuffled country names (1 correct + N wrong)
 */
export function getCountryOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
): string[] {
    return getQuizOptions(
        correctCountry,
        allCountries,
        (country) => getCountryName(country, 'deu'),
        wrongAnswerCount,
        answeredCorrectly,
    );
}
