import { useState, useCallback } from 'react';
import type { CountryData } from '../types/countries-json.js';

interface QuizState {
    currentIndex: number;
    randomizedCountries: CountryData[];
    correctCount: number;
    incorrectCount: number;
    feedback: 'correct' | 'incorrect' | null;
    clickedCountry: CountryData | null; // Track which country was clicked (for incorrect answers)
    answeredCorrectly: Set<string>; // Track cca3 codes of correctly answered countries
}

interface UseQuizReturn {
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

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export function useQuiz(countries: CountryData[]): UseQuizReturn {
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    const startQuiz = useCallback(() => {
        if (countries.length === 0) return;

        setQuizState({
            currentIndex: 0,
            randomizedCountries: shuffleArray(countries),
            correctCount: 0,
            incorrectCount: 0,
            feedback: null,
            clickedCountry: null,
            answeredCorrectly: new Set<string>(),
        });
    }, [countries]);

    const resetQuiz = useCallback(() => {
        setQuizState(null);
    }, []);

    // Clear feedback and move to next question (called on any click after incorrect answer)
    const clearFeedback = useCallback(() => {
        if (!quizState || quizState.feedback !== 'incorrect') return;

        // Move current question to the end of the list
        const updatedCountries = [...quizState.randomizedCountries];
        const currentQ = updatedCountries[quizState.currentIndex];
        updatedCountries.splice(quizState.currentIndex, 1);
        updatedCountries.push(currentQ);

        setQuizState({
            ...quizState,
            randomizedCountries: updatedCountries,
            feedback: null,
            clickedCountry: null,
        });
    }, [quizState]);

    const handleAnswer = useCallback(
        (country: CountryData) => {
            if (!quizState) return;

            const currentQuestion = quizState.randomizedCountries[quizState.currentIndex];
            if (!currentQuestion) return;

            const isCorrect = country.cca3 === currentQuestion.cca3;

            if (isCorrect) {
                // Correct answer - add to answeredCorrectly set and advance immediately
                const newAnsweredCorrectly = new Set(quizState.answeredCorrectly);
                newAnsweredCorrectly.add(country.cca3);

                const nextIndex = quizState.currentIndex + 1;
                if (nextIndex < quizState.randomizedCountries.length) {
                    // Move to next question
                    setQuizState({
                        ...quizState,
                        currentIndex: nextIndex,
                        correctCount: quizState.correctCount + 1,
                        feedback: null,
                        clickedCountry: null,
                        answeredCorrectly: newAnsweredCorrectly,
                    });
                } else {
                    // Quiz completed
                    setQuizState({
                        ...quizState,
                        correctCount: quizState.correctCount + 1,
                        feedback: null,
                        clickedCountry: null,
                        answeredCorrectly: newAnsweredCorrectly,
                    });
                }
            } else {
                // Incorrect answer - show feedback and track clicked country
                // Question will be moved to end when feedback is cleared
                setQuizState({
                    ...quizState,
                    incorrectCount: quizState.incorrectCount + 1,
                    feedback: 'incorrect',
                    clickedCountry: country,
                });

                // Wait for user to click to dismiss (no auto-timeout)
            }
        },
        [quizState],
    );

    const currentQuestion = quizState ? quizState.randomizedCountries[quizState.currentIndex] : null;

    const isCompleted = quizState ? quizState.currentIndex >= quizState.randomizedCountries.length : false;

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
