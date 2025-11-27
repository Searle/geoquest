import { useMemo } from 'react';
import clsx from 'clsx';

import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import { getCapitalOptions, getCountryOptions } from '../utils/choiceOptions.js';
import type { UseChoiceGame } from '../hooks/useChoiceGame.js';
import { GameHeader } from './GameHeader.js';
import type { Region } from '../types/countries-json.js';
import type { GameMode, OnSetGameMode } from '../types/game.js';

import './ChoiceGame.css';

interface ChoiceGameProps {
    gameMode: GameMode;
    choiceGame: UseChoiceGame;
    countries: CountryData[];
    region: Region;
    onRegionChange: (region: Region) => void;
    onSetGameMode: OnSetGameMode;
}

export const ChoiceGame = ({
    gameMode,
    choiceGame,
    countries,
    region,
    onRegionChange,
    onSetGameMode,
}: ChoiceGameProps) => {
    const { currentQuestion, quizState, isCompleted, handleAnswer: onAnswerSelect } = choiceGame;
    const incorrectCount = quizState?.incorrectCount ?? 0;

    // Determine mode-specific configuration
    const isCapitalMode = gameMode === 'choice-capital';
    const getOptions = isCapitalMode ? getCapitalOptions : getCountryOptions;
    const getCorrectAnswer = isCapitalMode ? getCapital : (country: CountryData) => getCountryName(country, 'deu');
    const getQuestionValue = isCapitalMode ? (country: CountryData) => getCountryName(country, 'deu') : getCapital;

    // Filter out answers for the current question to avoid showing the correct answer
    const answerHistory = useMemo(() => {
        if (!currentQuestion || !quizState?.answerHistory) return [];
        return quizState.answerHistory.filter((item) => item.country.cca3 !== currentQuestion.cca3);
    }, [currentQuestion, quizState?.answerHistory]);

    // Generate multiple choice options
    const quizOptions = useMemo(() => {
        if (!currentQuestion) return [];
        return getOptions(currentQuestion, countries, 3, quizState?.answeredCorrectly);
    }, [currentQuestion, countries, quizState?.answeredCorrectly, getOptions]);

    const header = (
        <GameHeader
            gameMode={gameMode}
            region={region}
            countries={countries}
            answeredCorrectly={quizState?.answeredCorrectly}
            randomizedCountries={quizState?.randomizedCountries}
            incorrectCount={quizState?.incorrectCount}
            label={isCapitalMode ? 'Hauptstadt von' : 'Land mit Hauptstadt'}
            value={isCapitalMode ? getCountryName(currentQuestion, 'deu') : getCapital(currentQuestion)}
            onRegionChange={onRegionChange}
            onSetGameMode={onSetGameMode}
        />
    );

    // Show completion screen
    if (isCompleted) {
        return (
            <>
                {header}
                <div className='quiz-completed'>
                    <h2>Yay, geschafft!</h2>
                    <div className='final-score'>
                        <div>Fehlversuche: {incorrectCount ?? 0}</div>
                    </div>
                    <button onClick={onSetGameMode[gameMode]}>Nochmal starten</button>
                </div>
            </>
        );
    }

    if (!currentQuestion) {
        return <div className='choice-game-loading'>Wird geladen...</div>;
    }

    return (
        <>
            {header}

            <div className='choice-game'>
                {/* Question Area */}
                <div className={clsx('quiz-area', 'quiz-question-area')}>
                    <div className={clsx('quiz-area', 'quiz-questions')}>
                        {quizOptions.map((option) => (
                            <button key={option} onClick={() => onAnswerSelect(option)}>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Answer Area */}
                <div className={clsx('quiz-area', 'quiz-answer-area')}>
                    <h3 className='answer-area-title'>Antworten:</h3>
                    <div className='answer-list'>
                        {answerHistory.length > 0 &&
                            answerHistory.map((item) => (
                                <div
                                    key={item.timestamp}
                                    className={clsx('answer-item', {
                                        'answer-item-correct': item.isCorrect,
                                        'answer-item-incorrect': !item.isCorrect,
                                    })}
                                >
                                    <div className='answer-item-country'>{getQuestionValue(item.country)}</div>
                                    <div className='answer-item-capital'>
                                        {item.isCorrect ? (
                                            <span className='answer-item-correct-mark'>✓</span>
                                        ) : (
                                            <span className='answer-item-incorrect-mark'>✗</span>
                                        )}
                                        {item.userAnswer}
                                        {!item.isCorrect && (
                                            <span className='answer-item-correct-answer'>
                                                {' '}
                                                (richtig: {getCorrectAnswer(item.country)})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
};
