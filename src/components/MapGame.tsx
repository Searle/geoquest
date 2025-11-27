import { useCallback, useState } from 'react';

import RegionMap from './RegionMap.js';
import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { type UseMapGame } from '../hooks/useMapGame.js';
import { GameHeader } from './GameHeader.js';
import type { GameMode, OnSetGameMode } from '../types/game.js';

import './MapGame.css';

interface HoverInfo {
    country: CountryData;
    x: number;
    y: number;
}

interface ClickPosition {
    x: number;
    y: number;
}

interface MapGameProps {
    gameMode: GameMode;
    mapGame: UseMapGame;
    region: Region;
    countries: CountryData[];
    isCompleted: boolean;
    onCountriesLoaded: (countries: CountryData[]) => void;
    onRegionChange: (region: Region) => void;
    onSetGameMode: OnSetGameMode;
}

export const MapGame = ({
    gameMode,
    mapGame,
    region,
    countries,
    isCompleted,
    onCountriesLoaded,
    onRegionChange,
    onSetGameMode,
}: MapGameProps) => {
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [clickPosition, setClickPosition] = useState<ClickPosition | null>(null);

    // Destructure quiz values for stable dependencies
    const { currentQuestion, handleAnswer, isAnsweredCorrectly, clickedCountry, quizState } = mapGame;
    const feedback = quizState?.feedback;
    const incorrectCount = quizState?.incorrectCount ?? 0;

    const runningQuiz = gameMode.startsWith('map-');

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
            onSetGameMode={onSetGameMode}
        />
    );

    // Dismiss incorrect feedback on any click
    const handleDismissIncorrect = () => {
        if (runningQuiz && feedback === 'incorrect') {
            mapGame.clearFeedback();
            setClickPosition(null);
        }
    };

    // Country interaction handlers
    const handleCountryClick = useCallback(
        (country: CountryData, event?: React.MouseEvent) => {
            if (runningQuiz) {
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
            if (runningQuiz) {
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

    // Show completion screen for map quizzes
    if (runningQuiz && isCompleted) {
        return (
            <>
                {header}
                <div className='quiz-completed'>
                    <h2>Yay, geschafft!</h2>
                    <div className='final-score'>
                        <div>Fehlversuche: {incorrectCount}</div>
                    </div>
                    <button onClick={() => onSetGameMode[gameMode]()}>Nochmal starten</button>
                </div>
            </>
        );
    }

    return (
        <>
            {header}
            {/* Map component */}
            <RegionMap
                region={region}
                onCountryClick={handleCountryClick}
                onCountryHover={handleCountryHover}
                onCountryLeave={handleCountryLeave}
                getCountryHighlight={getCountryHighlight}
                onCountriesLoaded={onCountriesLoaded}
                isAnsweredCorrectly={isAnsweredCorrectly}
                answeredCorrectlyCount={quizState?.answeredCorrectly.size ?? 0}
                hasIncorrectFeedback={feedback === 'incorrect'}
            />
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
        </>
    );
};
