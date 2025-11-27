import { useState, useCallback } from 'react';
import type { CountryData } from '../utils/countryData.js';
import { getCountryName } from '../utils/countryData.js';
import { shuffleArray } from '../utils/arrayUtils.js';
import type { GameMode } from '../types/game.js';

interface AnswerHistoryItem {
    country: CountryData;
    userAnswer: string; // The answer the user selected
    isCorrect: boolean;
    timestamp: number; // For unique keys
}

interface QuizState {
    randomizedCountries: CountryData[];
    incorrectCount: number;
    answeredCorrectly: Set<string>; // cca3 codes
    answerHistory: AnswerHistoryItem[];
    gameMode: GameMode | null;
}

export interface UseChoiceGame {
    quizState: QuizState | null;
    currentQuestion: CountryData | null;
    isCompleted: boolean;
    startQuiz: (gameMode: GameMode) => void;
    handleAnswer: (answer: string) => void;
    resetQuiz: () => void;
}

export function useChoiceGame(countries: CountryData[]): UseChoiceGame {
    const [quizState, setQuizState] = useState<QuizState | null>(null);

    const startQuiz = useCallback(
        (gameMode: GameMode) => {
            setQuizState({
                randomizedCountries: shuffleArray(countries),
                incorrectCount: 0,
                answeredCorrectly: new Set(),
                answerHistory: [],
                gameMode,
            });
        },
        [countries],
    );

    const handleAnswer = useCallback(
        (selectedAnswer: string) => {
            if (!quizState) return;

            const currentQuestion = quizState.randomizedCountries[quizState.answeredCorrectly.size];
            if (!currentQuestion) return;

            const isCapitalMode = quizState.gameMode === 'choice-capital';
            const correctAnswer = isCapitalMode
                ? currentQuestion.capital?.[0] || ''
                : getCountryName(currentQuestion, 'deu');
            const isCorrect = selectedAnswer === correctAnswer;

            setQuizState((prev) => {
                if (!prev) return prev;

                const newAnsweredCorrectly = new Set(prev.answeredCorrectly);
                let newIncorrectCount = prev.incorrectCount;
                let newRandomizedCountries = [...prev.randomizedCountries];
                let newAnswerHistory = [...prev.answerHistory];

                const newHistoryItem: AnswerHistoryItem = {
                    country: currentQuestion,
                    userAnswer: selectedAnswer,
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
                    gameMode: prev.gameMode,
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
