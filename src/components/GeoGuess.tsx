import { useCallback, useState } from 'react';
import clsx from 'clsx';

import RegionMap from './RegionMap.js';
import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useMapQuiz as useMapQuiz } from '../hooks/useMapQuiz.js';
import { useCapitalQuiz2 } from '../hooks/useCapitalQuiz2.js';
import { CapitalQuiz2 } from './CapitalQuiz2.js';

import './GeoGuess.css';

type GameMode = 'discover' | 'map-country' | 'map-capital' | 'capital2';

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

const GeoGuess = () => {
    const [region, setRegion] = useState<Region>('Africa');
    const [gameMode, setGameMode] = useState<GameMode>('discover');
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);

    const handleRegionChange = (region: string) => {
        setRegion(region as Region);
    };

    const quiz = useMapQuiz(countries);
    const quiz2 = useCapitalQuiz2(countries);

    // Destructure quiz values for stable dependencies
    const { startQuiz, resetQuiz, clearFeedback, handleAnswer, isAnsweredCorrectly, clickedCountry, quizState } = quiz;
    const feedback = quizState?.feedback;

    // Mode switching
    const handleStartCountryMap = () => {
        startQuiz();
        setGameMode('map-country');
    };

    const handleStartCapitalMap = () => {
        startQuiz();
        setGameMode('map-capital');
    };

    const handleStartCapitalQuiz2 = () => {
        quiz2.startQuiz();
        setGameMode('capital2');
    };

    const handleStartDiscover = () => {
        resetQuiz();
        quiz2.resetQuiz();
        setGameMode('discover');
    };

    // Dismiss incorrect feedback on any click
    const handleDismissIncorrect = () => {
        if ((gameMode === 'map-country' || gameMode === 'map-capital') && feedback === 'incorrect') {
            clearFeedback();
            setClickPosition(null);
        }
    };

    // Country interaction handlers
    const handleCountryClick = useCallback(
        (country: CountryData, event?: React.MouseEvent) => {
            if (gameMode === 'map-country' || gameMode === 'map-capital') {
                // Don't allow clicking on already correctly answered countries
                if (isAnsweredCorrectly(country)) {
                    return;
                }

                // If showing incorrect feedback, dismiss it (handled by overlay)
                if (feedback === 'incorrect') {
                    return;
                }

                // Store click position for showing label
                if (event) {
                    setClickPosition({ x: event.clientX, y: event.clientY });
                }
                handleAnswer(country);
            }
        },
        [gameMode, isAnsweredCorrectly, handleAnswer, feedback],
    );

    const handleCountryHover = useCallback((country: CountryData, event: React.MouseEvent<SVGPathElement>) => {
        setHoverInfo({
            country,
            x: event.clientX,
            y: event.clientY,
        });
    }, []);

    const handleCountryLeave = useCallback(() => {
        setHoverInfo(null);
    }, []);

    // Determine country highlight state
    const getCountryHighlight = useCallback(
        (country: CountryData): 'correct' | 'incorrect' | 'hovered' | null => {
            if (gameMode === 'map-country' || gameMode === 'map-capital') {
                // Quiz mode
                // Show all correctly answered countries in green
                if (isAnsweredCorrectly(country)) return 'correct';

                // Highlight the clicked wrong country
                const isClickedWrong =
                    clickedCountry && country.cca3 === clickedCountry.cca3 && feedback === 'incorrect';
                if (isClickedWrong) return 'incorrect';
            }
            if (hoverInfo?.country === country) return 'hovered';

            return null;
        },
        [gameMode, isAnsweredCorrectly, clickedCountry, feedback, hoverInfo],
    );

    // Pass countries up from RegionMap
    const handleCountriesLoaded = useCallback(
        (loadedCountries: CountryData[]) => {
            setCountries(loadedCountries);
        },
        [setCountries],
    );

    return (
        <div className='geo-guess'>
            {/* Fixed header section */}
            <div className='game-header'>
                {gameMode === 'discover' && (
                    <>
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
                        </div>
                        <div className='game-header-item'>
                            <span>Spiel:</span>

                            <button
                                className={clsx('mode-button')}
                                onClick={handleStartCountryMap}
                                disabled={countries.length === 0}
                            >
                                Länder-Karte
                            </button>
                            <button
                                className={clsx('mode-button')}
                                onClick={handleStartCapitalMap}
                                disabled={countries.length === 0}
                            >
                                Hauptstadt-Karte
                            </button>
                            <button
                                className={clsx('mode-button')}
                                onClick={handleStartCapitalQuiz2}
                                disabled={countries.length === 0}
                            >
                                Hauptstadt-Quiz
                            </button>
                        </div>
                    </>
                )}

                {/* Quiz UI - Map Quizzes */}
                {(gameMode === 'map-country' || gameMode === 'map-capital') && quizState && !quiz.isCompleted && (
                    <>
                        <div className='game-header-item'>
                            <span className='quiz-score'>
                                <span className='correct'>✔</span>
                                &nbsp;
                                {quizState.answeredCorrectly.size} / {quizState.randomizedCountries.length}
                            </span>
                            <span className='quiz-click-on'>Klicke:</span>
                            <span className='quiz-question'>
                                <strong>
                                    {gameMode === 'map-capital'
                                        ? getCapital(quiz.currentQuestion!)
                                        : getCountryName(quiz.currentQuestion!, 'deu')}
                                </strong>
                            </span>
                        </div>
                        <div className='game-header-item'>
                            <div className='quiz-score'>
                                <span className='incorrect'>↻</span>
                                &nbsp;
                                {quizState.incorrectCount}
                            </div>
                            <button className={clsx('mode-button')} onClick={handleStartDiscover}>
                                Abbrechen
                            </button>
                        </div>
                    </>
                )}

                {/* Quiz UI - Capital Quiz 2 */}
                {gameMode === 'capital2' && quiz2.quizState && !quiz2.isCompleted && (
                    <>
                        <div className='game-header-item'>
                            <span className='quiz-score'>
                                <span className='correct'>✔</span>
                                &nbsp;
                                {quiz2.quizState.answeredCorrectly.size} / {quiz2.quizState.randomizedCountries.length}
                            </span>
                        </div>
                        <div className='game-header-item'>
                            <div className='quiz-score'>
                                <span className='incorrect'>↻</span>
                                &nbsp;
                                {quiz2.quizState.incorrectCount}
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
                {/* Quiz completed - Map Quizzes */}
                {(gameMode === 'map-country' || gameMode === 'map-capital') && quiz.isCompleted && quizState && (
                    <div className='quiz-completed'>
                        <h2>Yay, geschafft!</h2>
                        <div className='final-score'>
                            <div>Fehlversuche: {quizState.incorrectCount}</div>
                        </div>
                        <button
                            className='mode-button'
                            onClick={gameMode === 'map-capital' ? handleStartCapitalMap : handleStartCountryMap}
                        >
                            Nochmal starten
                        </button>
                    </div>
                )}

                {/* Quiz completed - Capital Quiz 2 */}
                {gameMode === 'capital2' && quiz2.isCompleted && quiz2.quizState && (
                    <div className='quiz-completed'>
                        <h2>Yay, geschafft!</h2>
                        <div className='final-score'>
                            <div>Fehlversuche: {quiz2.quizState.incorrectCount}</div>
                        </div>
                        <button className='mode-button' onClick={handleStartCapitalQuiz2}>
                            Nochmal starten
                        </button>
                    </div>
                )}

                {/* Capital Quiz 2 Component */}
                {gameMode === 'capital2' && !quiz2.isCompleted && quiz2.currentQuestion && (
                    <CapitalQuiz2
                        currentQuestion={quiz2.currentQuestion}
                        answerHistory={quiz2.quizState?.answerHistory ?? []}
                        countries={countries}
                        onAnswerSelect={quiz2.handleAnswer}
                    />
                )}

                {/* Map component */}
                {(gameMode === 'discover' || gameMode === 'map-country' || gameMode === 'map-capital') && (
                    <RegionMap
                        region={region}
                        onCountryClick={handleCountryClick}
                        onCountryHover={handleCountryHover}
                        onCountryLeave={handleCountryLeave}
                        getCountryHighlight={getCountryHighlight}
                        onCountriesLoaded={handleCountriesLoaded}
                        isAnsweredCorrectly={isAnsweredCorrectly}
                        answeredCorrectlyCount={quizState?.answeredCorrectly.size ?? 0}
                        hasIncorrectFeedback={feedback === 'incorrect'}
                    />
                )}
            </div>

            {/* Hover tooltip */}
            {gameMode === 'discover' && hoverInfo && (
                <div
                    className='country-tooltip'
                    style={
                        {
                            '--tooltip-x': `${hoverInfo.x + 10}px`,
                            '--tooltip-y': `${hoverInfo.y + 10}px`,
                        } as React.CSSProperties
                    }
                >
                    <div className='country-name'>
                        {getCountryName(hoverInfo.country, 'deu')}
                        <span className='country-name-cca3'>({hoverInfo.country.cca3})</span>
                    </div>
                    <div className='country-capital'>Hauptstadt: {getCapital(hoverInfo.country)}</div>
                </div>
            )}

            {/* Click-anywhere overlay to dismiss incorrect feedback */}
            {(gameMode === 'map-country' || gameMode === 'map-capital') && feedback === 'incorrect' && (
                <div className='dismiss-overlay' onClick={handleDismissIncorrect} />
            )}

            {/* Incorrect country label (quiz mode) */}
            {(gameMode === 'map-country' || gameMode === 'map-capital') &&
                clickedCountry &&
                feedback === 'incorrect' &&
                clickPosition && (
                    <div
                        className='incorrect-country-label'
                        style={
                            {
                                '--label-x': `${clickPosition.x}px`,
                                '--label-y':
                                    clickPosition.y > window.innerHeight * 0.9
                                        ? `${clickPosition.y - 60}px`
                                        : `${clickPosition.y + 20}px`,
                            } as React.CSSProperties
                        }
                    >
                        {gameMode === 'map-capital' ? (
                            <>
                                <div className='incorrect-country-label-capital'>{getCapital(clickedCountry)}</div>
                                <div className='incorrect-country-label-country'>
                                    {getCountryName(clickedCountry, 'deu')}
                                </div>
                            </>
                        ) : (
                            getCountryName(clickedCountry, 'deu')
                        )}
                    </div>
                )}
        </div>
    );
};

export default GeoGuess;
