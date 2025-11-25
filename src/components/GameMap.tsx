import { useCallback, useState } from 'react';
import clsx from 'clsx';

import RegionMap from './RegionMap.js';
import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useQuiz } from '../hooks/useQuiz.js';

import './GameMap.css';

type GameMode = 'discover' | 'quiz';

interface HoverInfo {
    country: CountryData;
    x: number;
    y: number;
}

interface ClickPosition {
    x: number;
    y: number;
}

const regions = ['Americas', 'Asia', 'Africa', 'Europe', 'Oceania', 'Antarctic'];

const GameMap = () => {
    const [region, setRegion] = useState<Region>('Africa');
    const [gameMode, setGameMode] = useState<GameMode>('discover');
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);

    const handleRegionChange = (region: string) => {
        setRegion(region as Region);
    };

    const quiz = useQuiz(countries);

    // Mode switching
    const handleStartQuiz = () => {
        quiz.startQuiz();
        setGameMode('quiz');
    };

    const handleStartDiscover = () => {
        quiz.resetQuiz();
        setGameMode('discover');
    };

    // Dismiss incorrect feedback on any click
    const handleDismissIncorrect = () => {
        if (gameMode === 'quiz' && quiz.quizState?.feedback === 'incorrect') {
            quiz.clearFeedback();
            setClickPosition(null);
        }
    };

    // Country interaction handlers
    const handleCountryClick = (country: CountryData, event?: React.MouseEvent) => {
        if (gameMode === 'quiz') {
            // Don't allow clicking on already correctly answered countries
            if (quiz.isAnsweredCorrectly(country)) {
                return;
            }

            // If showing incorrect feedback, dismiss it (handled by overlay)
            if (quiz.quizState?.feedback === 'incorrect') {
                return;
            }

            // Store click position for showing label
            if (event) {
                setClickPosition({ x: event.clientX, y: event.clientY });
            }
            quiz.handleAnswer(country);
        }
    };

    const handleCountryHover = (country: CountryData, event: React.MouseEvent<SVGPathElement>) => {
        setHoverInfo({
            country,
            x: event.clientX,
            y: event.clientY,
        });
    };

    const handleCountryLeave = () => {
        setHoverInfo(null);
    };

    // Determine country highlight state
    const getCountryHighlight = (country: CountryData): 'correct' | 'incorrect' | 'hovered' | null => {
        if (gameMode === 'quiz') {
            // Quiz mode
            // Show all correctly answered countries in green
            if (quiz.isAnsweredCorrectly(country)) return 'correct';

            // Highlight the clicked wrong country
            const isClickedWrong =
                quiz.clickedCountry &&
                country.cca3 === quiz.clickedCountry.cca3 &&
                quiz.quizState?.feedback === 'incorrect';
            if (isClickedWrong) return 'incorrect';
        }
        if (hoverInfo?.country === country) return 'hovered';

        return null;
    };

    // Pass countries up from RegionMap
    const handleCountriesLoaded = useCallback(
        (loadedCountries: CountryData[]) => {
            setCountries(loadedCountries);
        },
        [setCountries],
    );

    return (
        <div className='region-map-container'>
            {/* Fixed header section */}
            <div className='game-header'>
                {gameMode !== 'quiz' && (
                    <div className='game-header-item'>
                        <select
                            className='mode-select'
                            value={region}
                            onChange={(e) => handleRegionChange(e.target.value)}
                        >
                            {regions.map((r) => (
                                <option key={r}>{r}</option>
                            ))}
                        </select>

                        <button
                            className={clsx('mode-button')}
                            onClick={handleStartQuiz}
                            disabled={countries.length === 0}
                        >
                            Quiz starten
                        </button>
                    </div>
                )}

                {/* Quiz UI */}
                {gameMode === 'quiz' && quiz.quizState && !quiz.isCompleted && (
                    <>
                        <div className='game-header-item'>
                            <span className='quiz-score'>
                                <span className='correct'>✔</span>
                                &nbsp;
                                {quiz.quizState.answeredCorrectly.size} / {quiz.quizState.randomizedCountries.length}
                            </span>
                            <span className='quiz-click-on'>Klicke:</span>
                            <span className='quiz-question'>
                                <strong>{getCountryName(quiz.currentQuestion!, 'deu')}</strong>
                            </span>
                        </div>
                        <div className='game-header-item'>
                            <div className='quiz-score'>
                                <span className='incorrect'>↻</span>
                                &nbsp;
                                {quiz.quizState.incorrectCount}
                            </div>
                            <button className={clsx('mode-button')} onClick={handleStartDiscover}>
                                Abbrechen
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Scrollable content section */}
            <div className='game-content'>
                {/* Quiz completed */}
                {gameMode === 'quiz' && quiz.isCompleted && quiz.quizState && (
                    <div className='quiz-completed'>
                        <h2>Yay, geschafft!</h2>
                        <div className='final-score'>
                            <div>Fehlversuche: {quiz.quizState.incorrectCount}</div>
                        </div>
                        <button className='mode-button' onClick={handleStartQuiz}>
                            Nochmal starten
                        </button>
                    </div>
                )}

                {/* Dumb map component */}
                <RegionMap
                    region={region}
                    onCountryClick={handleCountryClick}
                    onCountryHover={handleCountryHover}
                    onCountryLeave={handleCountryLeave}
                    getCountryHighlight={getCountryHighlight}
                    onCountriesLoaded={handleCountriesLoaded}
                    isAnsweredCorrectly={quiz.isAnsweredCorrectly}
                />
            </div>

            {/* Hover tooltip */}
            {gameMode === 'discover' && hoverInfo && (
                <div
                    className='country-tooltip'
                    style={{
                        left: `${hoverInfo.x + 10}px`,
                        top: `${hoverInfo.y + 10}px`,
                    }}
                >
                    <div className='country-name'>{getCountryName(hoverInfo.country, 'deu')}</div>
                    <div className='country-capital'>Hauptstadt: {getCapital(hoverInfo.country)}</div>
                </div>
            )}

            {/* Click-anywhere overlay to dismiss incorrect feedback */}
            {gameMode === 'quiz' && quiz.quizState?.feedback === 'incorrect' && (
                <div className='dismiss-overlay' onClick={handleDismissIncorrect} />
            )}

            {/* Incorrect country label (quiz mode) */}
            {gameMode === 'quiz' &&
                quiz.clickedCountry &&
                quiz.quizState?.feedback === 'incorrect' &&
                clickPosition && (
                    <div
                        className='incorrect-country-label'
                        style={{
                            left: `${clickPosition.x}px`,
                            top:
                                clickPosition.y > window.innerHeight * 0.9
                                    ? `${clickPosition.y - 60}px`
                                    : `${clickPosition.y + 20}px`,
                        }}
                    >
                        {getCountryName(quiz.clickedCountry, 'deu')}
                    </div>
                )}
        </div>
    );
};

export default GameMap;
