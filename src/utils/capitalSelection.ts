import { shuffleArray } from './arrayUtils.js';
import type { CountryData } from './countryData.js';

/**
 * Generates multiple choice options for a capital quiz question
 * @param correctCountry The country whose capital is the correct answer
 * @param allCountries All countries in the current region
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @returns Array of 4 shuffled capital names (1 correct + 3 wrong)
 */
export function getCapitalOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    wrongAnswerCount: number = 3,
): string[] {
    const correctCapital = correctCountry.capital?.[0] || '';

    // Filter out the correct country and countries without capitals
    const otherCountries = allCountries.filter(
        (country) => country.cca3 !== correctCountry.cca3 && country.capital?.length > 0,
    );

    // Take first N capitals as wrong answers
    const wrongCapitals = shuffleArray(otherCountries)
        .slice(0, wrongAnswerCount)
        .map((country) => country.capital![0]);

    // Combine correct and wrong answers
    return shuffleArray([correctCapital, ...wrongCapitals]);
}
