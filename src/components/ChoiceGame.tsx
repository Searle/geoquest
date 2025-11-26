import { useMemo } from 'react';
import clsx from 'clsx';

import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import { getCapitalOptions } from '../utils/capitalSelection.js';
import type { UseChoiceGame } from '../hooks/useChoiceGame.js';
import { GameHeader } from './GameHeader.js';
import type { Region } from '../types/countries-json.js';
import type { GameMode } from '../types/game.js';

import './ChoiceGame.css';

interface ChoiceGameProps {
    gameMode: GameMode;
    choiceGame: UseChoiceGame;
    countries: CountryData[];
    region: Region;
    onRestart: () => void;
    onRegionChange: (region: string) => void;
    onStartCountryMapGame: () => void;
    onStartCapitalMapGame: () => void;
    onStartCapitalChoiceGame: () => void;
    onStartDiscover: () => void;
}

export const ChoiceGame = ({
    gameMode,
    choiceGame,
    countries,
    region,
    onRestart,
    onRegionChange,
    onStartCountryMapGame,
    onStartCapitalMapGame,
    onStartCapitalChoiceGame,
    onStartDiscover,
}: ChoiceGameProps) => {
    const { currentQuestion, quizState, isCompleted, handleAnswer: onAnswerSelect } = choiceGame;
    const answerHistory = quizState?.answerHistory ?? [];
    const incorrectCount = quizState?.incorrectCount ?? 0;

    // Generate multiple choice options
    const capitalOptions = useMemo(() => {
        if (!currentQuestion) return [];
        return getCapitalOptions(currentQuestion, countries);
    }, [currentQuestion, countries]);

    const header = (
        <GameHeader
            gameMode={gameMode}
            region={region}
            countries={countries}
            answeredCorrectly={quizState?.answeredCorrectly}
            randomizedCountries={quizState?.randomizedCountries}
            incorrectCount={quizState?.incorrectCount}
            label='Klicke'
            value={gameMode === 'map-capital' ? getCapital(currentQuestion) : getCountryName(currentQuestion, 'deu')}
            onRegionChange={onRegionChange}
            onStartCountryMapGame={onStartCountryMapGame}
            onStartCapitalMapGame={onStartCapitalMapGame}
            onStartCapitalChoiceGame={onStartCapitalChoiceGame}
            onStartDiscover={onStartDiscover}
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
                    <button className='mode-button' onClick={onRestart}>
                        Nochmal starten
                    </button>
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
            <div className='choice-game-container'>
                {/* Question Area */}
                <div className='quiz-question-area'>
                    <h2 className='quiz-question-title'>Die Hauptstadt von:</h2>
                    <h1 className='quiz-question-country'>{getCountryName(currentQuestion, 'deu')}</h1>
                    <div className='capital-choice-buttons'>
                        {capitalOptions.map((capital) => (
                            <button
                                key={capital}
                                className='capital-choice-button'
                                onClick={() => onAnswerSelect(capital)}
                            >
                                {capital}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Answer Area */}
                <div className='quiz-answer-area'>
                    <h3 className='answer-area-title'>Antworten:</h3>
                    <div className='answer-list'>
                        {answerHistory.length === 0 ? (
                            <div className='answer-list-empty'>Noch keine Antworten</div>
                        ) : (
                            answerHistory.map((item) => (
                                <div
                                    key={item.timestamp}
                                    className={clsx('answer-item', {
                                        'answer-item-correct': item.isCorrect,
                                        'answer-item-incorrect': !item.isCorrect,
                                    })}
                                >
                                    <div className='answer-item-country'>{getCountryName(item.country, 'deu')}</div>
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
                                                (richtig: {getCapital(item.country)})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
