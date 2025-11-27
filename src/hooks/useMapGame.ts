import { useState, useCallback } from 'react';

import type { CountryData } from '../types/countries-json.js';
import {
    type BaseQuizState,
    createBaseQuizState,
    getCurrentQuestion,
    isQuizCompleted,
    requeueQuestion,
    isAnswerCorrect,
    markAsCorrect,
} from './useGameUtils.js';

/**
 * Number of questions to wait before showing a failed question again
 */
export const REQUEUE_OFFSET = 15;

interface QuizState extends BaseQuizState {
    feedback: 'correct' | 'incorrect' | null;
    clickedCountry: CountryData | null; // Track which country was clicked (for incorrect answers)
}

export interface UseMapGame {
    quizState: QuizState | null;
    currentQuestion: CountryData | null;
    clickedCountry: CountryData | null;
    isCompleted: boolean;
    startQuiz: () => void;
    handleAnswer: (country: CountryData) => void;
    clearFeedback: () => void;
    resetQuiz: () => void;
    isCorrectCountry: (country: CountryData) => boolean;
    hasActiveFeedback: boolean;
    isAnsweredCorrectly: (country: CountryData) => boolean;
}

export function useMapGame(countries: CountryData[]): UseMapGame {
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    const resetQuiz = useCallback(() => {
        setQuizState(null);
    }, []);

    const startQuiz = useCallback(() => {
        setQuizState({
            ...createBaseQuizState(countries),
            feedback: null,
            clickedCountry: null,
        });
    }, [countries]);

    // Clear feedback and move to next question (called on any click after incorrect answer)
    const clearFeedback = useCallback(() => {
        setQuizState((prev) => {
            if (!prev || prev.feedback !== 'incorrect') return prev;

            const currentIndex = prev.answeredCorrectly.size;
            const updatedCountries = requeueQuestion(prev.randomizedCountries, currentIndex, REQUEUE_OFFSET);

            return {
                ...prev,
                randomizedCountries: updatedCountries,
                feedback: null,
                clickedCountry: null,
            };
        });
    }, []);

    const handleAnswer = useCallback((country: CountryData) => {
        setQuizState((prev) => {
            if (!prev) return prev;

            const currentQuestion = getCurrentQuestion(prev);
            if (!currentQuestion) return prev;

            const isCorrect = isAnswerCorrect(country, currentQuestion);

            if (isCorrect) {
                // Correct answer - add to answeredCorrectly set and advance immediately
                const newAnsweredCorrectly = markAsCorrect(prev.answeredCorrectly, country);

                return {
                    ...prev,
                    feedback: null,
                    clickedCountry: null,
                    answeredCorrectly: newAnsweredCorrectly,
                };
            } else {
                // Incorrect answer - show feedback and track clicked country
                // Question will be requeued when feedback is cleared
                return {
                    ...prev,
                    incorrectCount: prev.incorrectCount + 1,
                    feedback: 'incorrect',
                    clickedCountry: country,
                };
            }
        });
    }, []);

    const currentQuestion = quizState ? getCurrentQuestion(quizState) : null;

    const isCompleted = quizState ? isQuizCompleted(quizState) : false;

    const isCorrectCountry = useCallback(
        (country: CountryData) => {
            return currentQuestion?.cca3 === country.cca3;
        },
        [currentQuestion],
    );

    const hasActiveFeedback = quizState?.feedback !== null;
    const clickedCountry = quizState?.clickedCountry ?? null;

    const isAnsweredCorrectly = useCallback(
        (country: CountryData) => {
            return quizState?.answeredCorrectly.has(country.cca3) ?? false;
        },
        [quizState?.answeredCorrectly],
    );

    return {
        quizState,
        currentQuestion,
        clickedCountry,
        isCompleted,
        startQuiz,
        handleAnswer,
        clearFeedback,
        resetQuiz,
        isCorrectCountry,
        hasActiveFeedback,
        isAnsweredCorrectly,
    };
}
