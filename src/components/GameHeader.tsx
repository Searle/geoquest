import clsx from 'clsx';

import { type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { regions, type GameMode, type OnSetGameMode } from '../types/game.js';

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
    onRegionChange: (region: Region) => void;
    onSetGameMode: OnSetGameMode;
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
    onSetGameMode,
}: GameHeaderProps) => (
    <div className='game-header'>
        {/* Discover Mode Header */}
        {gameMode === 'discover' && (
            <>
                <div className='game-header-item'>
                    <select value={region} onChange={(e) => onRegionChange(e.target.value as unknown as Region)}>
                        {regions.map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className='game-header-item'>
                    <span>Spiel starten:</span>

                    <button onClick={onSetGameMode['map-country']} disabled={countries.length === 0}>
                        Länder-Karte
                    </button>
                    <button onClick={onSetGameMode['map-capital']} disabled={countries.length === 0}>
                        Hauptstadt-Karte
                    </button>
                    <button onClick={onSetGameMode['choice-capital']} disabled={countries.length === 0}>
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
                    <button onClick={onSetGameMode['discover']}>Abbrechen</button>
                </div>
            </>
        )}
    </div>
);
