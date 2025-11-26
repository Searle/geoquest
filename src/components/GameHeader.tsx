import clsx from 'clsx';

import { getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';

import './GameHeader.css';

type GameMode = 'discover' | 'map-country' | 'map-capital' | 'capital2';

interface MapQuizState {
    randomizedCountries: CountryData[];
    incorrectCount: number;
    answeredCorrectly: Set<string>;
    feedback: 'correct' | 'incorrect' | null;
    clickedCountry: CountryData | null;
}

interface ChoiceGameState {
    randomizedCountries: CountryData[];
    incorrectCount: number;
    answeredCorrectly: Set<string>;
}

interface GameHeaderProps {
    gameMode: GameMode;
    region: Region;
    regions: string[];
    countries: CountryData[];
    mapQuizState: MapQuizState | null;
    mapQuizCompleted: boolean;
    mapCurrentQuestion: CountryData | null;
    choiceGameState: ChoiceGameState | null;
    choiceGameCompleted: boolean;
    onRegionChange: (region: string) => void;
    onStartCountryMapGame: () => void;
    onStartCapitalMapGame: () => void;
    onStartCapitalChoiceGame: () => void;
    onStartDiscover: () => void;
}

export const GameHeader = ({
    gameMode,
    region,
    regions,
    countries,
    mapQuizState,
    mapQuizCompleted,
    mapCurrentQuestion,
    choiceGameState,
    choiceGameCompleted,
    onRegionChange,
    onStartCountryMapGame,
    onStartCapitalMapGame,
    onStartCapitalChoiceGame,
    onStartDiscover,
}: GameHeaderProps) => {
    return (
        <div className='game-header'>
            {/* Discover Mode Header */}
            {gameMode === 'discover' && (
                <>
                    <div className='game-header-item'>
                        <select className='mode-select' value={region} onChange={(e) => onRegionChange(e.target.value)}>
                            {regions.map((r) => (
                                <option key={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div className='game-header-item'>
                        <span>Spiel:</span>

                        <button
                            className={clsx('mode-button')}
                            onClick={onStartCountryMapGame}
                            disabled={countries.length === 0}
                        >
                            Länder-Karte
                        </button>
                        <button
                            className={clsx('mode-button')}
                            onClick={onStartCapitalMapGame}
                            disabled={countries.length === 0}
                        >
                            Hauptstadt-Karte
                        </button>
                        <button
                            className={clsx('mode-button')}
                            onClick={onStartCapitalChoiceGame}
                            disabled={countries.length === 0}
                        >
                            Hauptstadt-Quiz
                        </button>
                    </div>
                </>
            )}

            {/* Map Quiz Header */}
            {(gameMode === 'map-country' || gameMode === 'map-capital') && mapQuizState && !mapQuizCompleted && (
                <>
                    <div className='game-header-item'>
                        <span className='quiz-score'>
                            <span className='correct'>✔</span>
                            &nbsp;
                            {mapQuizState.answeredCorrectly.size} / {mapQuizState.randomizedCountries.length}
                        </span>
                        <span className='quiz-click-on'>Klicke:</span>
                        <span className='quiz-question'>
                            <strong>
                                {gameMode === 'map-capital'
                                    ? getCapital(mapCurrentQuestion!)
                                    : getCountryName(mapCurrentQuestion!, 'deu')}
                            </strong>
                        </span>
                    </div>
                    <div className='game-header-item'>
                        <div className='quiz-score'>
                            <span className='incorrect'>↻</span>
                            &nbsp;
                            {mapQuizState.incorrectCount}
                        </div>
                        <button className={clsx('mode-button')} onClick={onStartDiscover}>
                            Abbrechen
                        </button>
                    </div>
                </>
            )}

            {/* Capital Quiz 2 Header */}
            {gameMode === 'capital2' && choiceGameState && !choiceGameCompleted && (
                <>
                    <div className='game-header-item'>
                        <span className='quiz-score'>
                            <span className='correct'>✔</span>
                            &nbsp;
                            {choiceGameState.answeredCorrectly.size} / {choiceGameState.randomizedCountries.length}
                        </span>
                    </div>
                    <div className='game-header-item'>
                        <div className='quiz-score'>
                            <span className='incorrect'>↻</span>
                            &nbsp;
                            {choiceGameState.incorrectCount}
                        </div>
                        <button className={clsx('mode-button')} onClick={onStartDiscover}>
                            Abbrechen
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
