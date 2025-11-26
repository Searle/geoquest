import { useCallback, useState } from 'react';
import clsx from 'clsx';

import RegionMap from './RegionMap.js';
import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useMapQuiz as useMapQuiz } from '../hooks/useMapQuiz.js';
import { useChoiceGame as useChoiceGame } from '../hooks/useChoiceGame.js';
import { ChoiceGame } from './ChoiceGame.js';
import { GameHeader } from './GameHeader.js';

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

    const mapGame = useMapQuiz(countries);
    const choiceGame = useChoiceGame(countries);

    // Destructure quiz values for stable dependencies
    const { startQuiz, resetQuiz, clearFeedback, handleAnswer, isAnsweredCorrectly, clickedCountry, quizState } =
        mapGame;
    const feedback = quizState?.feedback;

    // Mode switching
    const handleStartCountryMapGame = () => {
        startQuiz();
        setGameMode('map-country');
    };

    const handleStartCapitalMapGame = () => {
        startQuiz();
        setGameMode('map-capital');
    };

    const handleStartCapitalChoiceGame = () => {
        choiceGame.startQuiz();
        setGameMode('capital2');
    };

    const handleStartDiscover = () => {
        resetQuiz();
        choiceGame.resetQuiz();
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
            <GameHeader
                gameMode={gameMode}
                region={region}
                regions={regions}
                countries={countries}
                mapQuizState={quizState}
                mapQuizCompleted={mapGame.isCompleted}
                mapCurrentQuestion={mapGame.currentQuestion}
                choiceGameState={choiceGame.quizState}
                choiceGameCompleted={choiceGame.isCompleted}
                onRegionChange={handleRegionChange}
                onStartCountryMapGame={handleStartCountryMapGame}
                onStartCapitalMapGame={handleStartCapitalMapGame}
                onStartCapitalChoiceGame={handleStartCapitalChoiceGame}
                onStartDiscover={handleStartDiscover}
            />

            {/* Scrollable content section */}
            <div className='game-content'>
                {/* Quiz completed - Map Quizzes */}
                {(gameMode === 'map-country' || gameMode === 'map-capital') && mapGame.isCompleted && quizState && (
                    <div className='quiz-completed'>
                        <h2>Yay, geschafft!</h2>
                        <div className='final-score'>
                            <div>Fehlversuche: {quizState.incorrectCount}</div>
                        </div>
                        <button
                            className='mode-button'
                            onClick={gameMode === 'map-capital' ? handleStartCapitalMapGame : handleStartCountryMapGame}
                        >
                            Nochmal starten
                        </button>
                    </div>
                )}

                {/* Quiz completed - Capital Quiz 2 */}
                {gameMode === 'capital2' && choiceGame.isCompleted && choiceGame.quizState && (
                    <div className='quiz-completed'>
                        <h2>Yay, geschafft!</h2>
                        <div className='final-score'>
                            <div>Fehlversuche: {choiceGame.quizState.incorrectCount}</div>
                        </div>
                        <button className='mode-button' onClick={handleStartCapitalChoiceGame}>
                            Nochmal starten
                        </button>
                    </div>
                )}

                {/* Capital Quiz 2 Component */}
                {gameMode === 'capital2' && !choiceGame.isCompleted && choiceGame.currentQuestion && (
                    <ChoiceGame
                        currentQuestion={choiceGame.currentQuestion}
                        answerHistory={choiceGame.quizState?.answerHistory ?? []}
                        countries={countries}
                        onAnswerSelect={choiceGame.handleAnswer}
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
