import { useState, useCallback } from 'react';
import type { CountryData } from '../utils/countryData.js';
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
export const REQUEUE_OFFSET = 5;

interface AnswerHistoryItem {
    country: CountryData;
    userAnswer: CountryData; // The country the user selected
    isCorrect: boolean;
    timestamp: number; // For unique keys
}

interface QuizState extends BaseQuizState {
    answerHistory: AnswerHistoryItem[];
}

export interface UseChoiceGame {
    quizState: QuizState | null;
    currentQuestion: CountryData | null;
    isCompleted: boolean;
    startQuiz: () => void;
    handleAnswer: (answer: CountryData) => void;
    resetQuiz: () => void;
}

export function useChoiceGame(countries: CountryData[]): UseChoiceGame {
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    const resetQuiz = useCallback(() => {
        setQuizState(null);
    }, []);

    const startQuiz = useCallback(() => {
        setQuizState({
            ...createBaseQuizState(countries),
            answerHistory: [],
        });
    }, [countries]);

    const handleAnswer = useCallback((selectedAnswer: CountryData) => {
        setQuizState((prev) => {
            if (!prev) return prev;

            const currentQuestion = getCurrentQuestion(prev);
            if (!currentQuestion) return prev;

            const isCorrect = isAnswerCorrect(selectedAnswer, currentQuestion);

            const newHistoryItem: AnswerHistoryItem = {
                country: currentQuestion,
                userAnswer: selectedAnswer,
                isCorrect,
                timestamp: Date.now(),
            };

            // Remove all previous attempts for the current question before adding the new one
            let newAnswerHistory = [
                newHistoryItem,
                ...prev.answerHistory.filter((item) => item.country.cca3 !== currentQuestion.cca3),
            ];

            if (isCorrect) {
                const newAnsweredCorrectly = markAsCorrect(prev.answeredCorrectly, currentQuestion);

                return {
                    ...prev,
                    answeredCorrectly: newAnsweredCorrectly,
                    answerHistory: newAnswerHistory,
                };
            } else {
                // Incorrect answer - requeue question and increment error count
                const currentIndex = prev.answeredCorrectly.size;
                const newRandomizedCountries = requeueQuestion(prev.randomizedCountries, currentIndex, REQUEUE_OFFSET);

                return {
                    ...prev,
                    randomizedCountries: newRandomizedCountries,
                    incorrectCount: prev.incorrectCount + 1,
                    answerHistory: newAnswerHistory,
                };
            }
        });
    }, []);

    const currentQuestion = quizState ? getCurrentQuestion(quizState) : null;

    const isCompleted = quizState ? isQuizCompleted(quizState) : false;

    return {
        quizState,
        currentQuestion,
        isCompleted,
        startQuiz,
        handleAnswer,
        resetQuiz,
    };
}
