import { shuffleArray } from './arrayUtils.js';
import type { CountryData } from './countryData.js';

/**
 * Generates multiple choice options for a capital quiz question
 * @param correctCountry The country whose capital is the correct answer
 * @param allCountries All countries in the current region
 * @param wrongAnswerCount Number of incorrect options to generate (default: 3)
 * @param answeredCorrectly Optional set of country codes that have been answered correctly
 * @returns Array of 4 shuffled capital names (1 correct + 3 wrong)
 */
export function getCapitalOptions(
    correctCountry: CountryData,
    allCountries: CountryData[],
    wrongAnswerCount: number = 3,
    answeredCorrectly?: Set<string>,
): string[] {
    const correctCapital = correctCountry.capital?.[0] || '';

    // Filter out the correct country and countries without capitals
    let otherCountries = allCountries.filter(
        (country) => country.cca3 !== correctCountry.cca3 && country.capital?.length > 0,
    );

    // Try to avoid countries that have been answered correctly
    if (answeredCorrectly && answeredCorrectly.size > 0) {
        const unansweredCountries = otherCountries.filter((country) => !answeredCorrectly.has(country.cca3));
        // Only use unanswered countries if we have enough for wrong answers
        if (unansweredCountries.length >= wrongAnswerCount) {
            otherCountries = unansweredCountries;
        }
    }

    // Take first N capitals as wrong answers
    const wrongCapitals = shuffleArray(otherCountries)
        .slice(0, wrongAnswerCount)
        .map((country) => country.capital![0]);

    // Combine correct and wrong answers
    return shuffleArray([correctCapital, ...wrongCapitals]);
}
