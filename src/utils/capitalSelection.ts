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

    // Shuffle other countries
    const shuffled = [...otherCountries];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take first N capitals as wrong answers
    const wrongCapitals = shuffled.slice(0, wrongAnswerCount).map((country) => country.capital![0]);

    // Combine correct and wrong answers
    const allOptions = [correctCapital, ...wrongCapitals];

    // Shuffle the combined array
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    return allOptions;
}
