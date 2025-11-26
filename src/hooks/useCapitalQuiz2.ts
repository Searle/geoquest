import { useState, useCallback } from 'react';
import type { CountryData } from '../utils/countryData.js';

export interface AnswerHistoryItem {
    country: CountryData;
    userAnswer: string; // Capital name the user selected
    isCorrect: boolean;
    timestamp: number; // For unique keys
}

interface QuizState {
    randomizedCountries: CountryData[];
    incorrectCount: number;
    answeredCorrectly: Set<string>; // cca3 codes
    answerHistory: AnswerHistoryItem[];
}

export function useCapitalQuiz2(countries: CountryData[]) {
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    const startQuiz = useCallback(() => {
        // Fisher-Yates shuffle
        const shuffled = [...countries];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setQuizState({
            randomizedCountries: shuffled,
            incorrectCount: 0,
            answeredCorrectly: new Set(),
            answerHistory: [],
        });
    }, [countries]);

    const handleAnswer = useCallback(
        (selectedCapital: string) => {
            if (!quizState) return;

            const currentQuestion = quizState.randomizedCountries[quizState.answeredCorrectly.size];
            if (!currentQuestion) return;

            const correctCapital = currentQuestion.capital?.[0] || '';
            const isCorrect = selectedCapital === correctCapital;

            setQuizState((prev) => {
                if (!prev) return prev;

                const newAnsweredCorrectly = new Set(prev.answeredCorrectly);
                let newIncorrectCount = prev.incorrectCount;
                let newRandomizedCountries = [...prev.randomizedCountries];
                let newAnswerHistory = [...prev.answerHistory];

                const newHistoryItem: AnswerHistoryItem = {
                    country: currentQuestion,
                    userAnswer: selectedCapital,
                    isCorrect,
                    timestamp: Date.now(),
                };

                // Add new answer at the beginning (top of list)
                newAnswerHistory.unshift(newHistoryItem);

                if (isCorrect) {
                    newAnsweredCorrectly.add(currentQuestion.cca3);
                    // Remove all previous wrong attempts for this country
                    newAnswerHistory = newAnswerHistory.filter(
                        (item) => item.country.cca3 !== currentQuestion.cca3 || item.isCorrect,
                    );
                } else {
                    newIncorrectCount++;
                    // Move current question to end of list
                    const currentIndex = prev.answeredCorrectly.size;
                    const questionToMove = newRandomizedCountries[currentIndex];
                    newRandomizedCountries.splice(currentIndex, 1);
                    newRandomizedCountries.push(questionToMove);
                }

                return {
                    randomizedCountries: newRandomizedCountries,
                    incorrectCount: newIncorrectCount,
                    answeredCorrectly: newAnsweredCorrectly,
                    answerHistory: newAnswerHistory,
                };
            });
        },
        [quizState],
    );

    const resetQuiz = useCallback(() => {
        setQuizState(null);
    }, []);

    const currentQuestion = quizState ? quizState.randomizedCountries[quizState.answeredCorrectly.size] : null;

    const isCompleted = quizState ? quizState.answeredCorrectly.size >= quizState.randomizedCountries.length : false;

    return {
        quizState,
        currentQuestion,
        isCompleted,
        startQuiz,
        handleAnswer,
        resetQuiz,
    };
}
