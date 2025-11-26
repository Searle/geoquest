import { useMemo } from 'react';
import clsx from 'clsx';

import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import { getCapitalOptions } from '../utils/capitalSelection.js';
import type { AnswerHistoryItem } from '../hooks/useCapitalQuiz2.js';

import './CapitalQuiz2.css';

interface CapitalQuiz2Props {
    currentQuestion: CountryData | null;
    answerHistory: AnswerHistoryItem[];
    countries: CountryData[];
    onAnswerSelect: (capital: string) => void;
}

export const CapitalQuiz2 = ({ currentQuestion, answerHistory, countries, onAnswerSelect }: CapitalQuiz2Props) => {
    // Generate multiple choice options
    const capitalOptions = useMemo(() => {
        if (!currentQuestion) return [];
        return getCapitalOptions(currentQuestion, countries);
    }, [currentQuestion, countries]);

    if (!currentQuestion) {
        return <div className='capital-quiz2-loading'>Wird geladen...</div>;
    }

    return (
        <div className='capital-quiz2-container'>
            {/* Question Area */}
            <div className='quiz-question-area'>
                <h2 className='quiz-question-title'>Die Hauptstadt von:</h2>
                <h1 className='quiz-question-country'>{getCountryName(currentQuestion, 'deu')}</h1>
                <div className='capital-choice-buttons'>
                    {capitalOptions.map((capital) => (
                        <button key={capital} className='capital-choice-button' onClick={() => onAnswerSelect(capital)}>
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
    );
};
