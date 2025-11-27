import type { CountryData } from '../utils/countryData.js';
import { shuffleArray } from '../utils/arrayUtils.js';

/**
 * Number of questions to wait before showing a failed question again
 */
export const REQUEUE_OFFSET = 5;

/**
 * Base quiz state shared by all game modes
 */
export interface BaseQuizState {
    randomizedCountries: CountryData[];
    incorrectCount: number;
    answeredCorrectly: Set<string>; // Track cca3 codes of correctly answered countries
}

/**
 * Create initial base quiz state
 */
export function createBaseQuizState(countries: CountryData[]): BaseQuizState {
    return {
        randomizedCountries: shuffleArray(countries),
        incorrectCount: 0,
        answeredCorrectly: new Set<string>(),
    };
}

/**
 * Get the current question based on quiz state
 */
export function getCurrentQuestion(state: BaseQuizState): CountryData | null {
    return state.randomizedCountries[state.answeredCorrectly.size] ?? null;
}

/**
 * Check if quiz is completed
 */
export function isQuizCompleted(state: BaseQuizState): boolean {
    return state.answeredCorrectly.size >= state.randomizedCountries.length;
}

/**
 * Check if the selected answer is correct
 */
export function isAnswerCorrect(selectedAnswer: CountryData, correctAnswer: CountryData): boolean {
    return selectedAnswer.cca3 === correctAnswer.cca3;
}

/**
 * Mark a country as correctly answered
 * Returns a new Set with the country added
 */
export function markAsCorrect(answeredCorrectly: Set<string>, country: CountryData): Set<string> {
    const newSet = new Set(answeredCorrectly);
    newSet.add(country.cca3);
    return newSet;
}

/**
 * Requeue a question after incorrect answer by moving it N positions later
 * (or to the end if there aren't enough remaining items)
 */
export function requeueQuestion<T>(items: T[], currentIndex: number, offset: number = REQUEUE_OFFSET): T[] {
    const result = [...items];
    const itemToMove = result[currentIndex];

    // Remove item from current position
    result.splice(currentIndex, 1);

    // Calculate target position: offset items after current, or at end
    const remainingItems = result.length - currentIndex;
    const targetOffset = Math.min(offset, remainingItems);
    const targetIndex = currentIndex + targetOffset;

    // Insert at target position
    result.splice(targetIndex, 0, itemToMove);

    return result;
}
