import { shuffleArray } from './arrayUtils.js';
import type { CountryData } from './countryData.js';
import { getCountryName } from './countryData.js';

/**
 * Generates multiple choice options for a quiz question
 * @param correctCountry The country that is the correct answer
 * @param allCountries All countries in the current region
 * @param extractValue Function to extract the display value from a country (e.g., capital or country name)
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @returns Array of shuffled option strings (1 correct + N wrong)
 */
export function getQuizOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    extractValue: (country: CountryData) => string | undefined,
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
): string[] {
    const correctValue = extractValue(correctCountry) || '';

    // Filter out the correct country and countries without valid values
    let otherCountries = allCountries.filter((country) => {
        const value = extractValue(country);
        return country.cca3 !== correctCountry.cca3 && value && value.length > 0;
    });

    // Try to avoid countries that have been answered correctly
    if (answeredCorrectly && answeredCorrectly.size > 0) {
        const unansweredCountries = otherCountries.filter((country) => !answeredCorrectly.has(country.cca3));
        // Only use unanswered countries if we have enough for wrong answers
        if (unansweredCountries.length >= wrongAnswerCount) {
            otherCountries = unansweredCountries;
        }
    }

    // Take first N values as wrong answers
    const wrongValues = shuffleArray(otherCountries)
        .slice(0, wrongAnswerCount)
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
