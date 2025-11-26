import clsx from 'clsx';

import { type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { regions, type GameMode } from '../types/game.js';

import './GameHeader.css';

interface GameHeaderProps {
    gameMode: GameMode;
    region: Region;
    countries: CountryData[];
    answeredCorrectly: Set<string> | undefined;
    randomizedCountries: CountryData[] | undefined;
    incorrectCount: number | undefined;
    label: string;
    value: string;
    onRegionChange: (region: string) => void;
    onStartCountryMapGame: () => void;
    onStartCapitalMapGame: () => void;
    onStartCapitalChoiceGame: () => void;
    onStartDiscover: () => void;
}

export const GameHeader = ({
    gameMode,
    region,
    countries,
    answeredCorrectly,
    randomizedCountries,
    incorrectCount,
    label,
    value,
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

            {gameMode !== 'discover' && (
                <>
                    <div className='game-header-item'>
                        <span className='quiz-score'>
                            <span className='correct'>✔</span>
                            &nbsp;
                            {answeredCorrectly?.size ?? 0} / {randomizedCountries?.length ?? 0}
                        </span>
                        <span className='quiz-click-on'>{label}:</span>
                        <span className='quiz-question'>{value}</span>
                    </div>
                    <div className='game-header-item'>
                        <div className='quiz-score'>
                            <span className='incorrect'>↻</span>
                            &nbsp;
                            {incorrectCount ?? 0}
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
