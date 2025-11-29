import clsx from 'clsx';

import { type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { regions, type GameMode, type OnSetGameMode } from '../types/game.js';

import * as styles from './GameHeader.css.ts';

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
    <div className={clsx(styles.header, { [styles.game]: gameMode !== 'discover' })}>
        {/* Discover Mode Header */}
        {gameMode === 'discover' && (
            <>
                <div className={styles.item}>
                    <select value={region} onChange={(e) => onRegionChange(e.target.value as unknown as Region)}>
                        {regions.map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.item}>
                    <span>Karte lernen:</span>
                    <button onClick={onSetGameMode['map-country']} disabled={countries.length === 0}>
                        Länder
                    </button>
                    <button onClick={onSetGameMode['map-capital']} disabled={countries.length === 0}>
                        Hauptstädte
                    </button>
                    <span>&nbsp; Quiz:</span>
                    <button onClick={onSetGameMode['choice-country']} disabled={countries.length === 0}>
                        Länder
                    </button>
                    <button onClick={onSetGameMode['choice-capital']} disabled={countries.length === 0}>
                        Hauptstädte
                    </button>
                </div>
            </>
        )}
        {gameMode !== 'discover' && (
            <>
                <div className={styles.item}>
                    <span className={styles.score}>
                        <span className='correct'>✔</span>
                        &nbsp;
                        {answeredCorrectly?.size ?? 0} / {randomizedCountries?.length ?? 0}
                    </span>
                    <span className={styles.label}>{label}:</span>
                    <span className={styles.question}>{value}</span>
                </div>
                <div className={styles.item}>
                    <div className={styles.score}>
                        <span className='incorrect'>↻</span>
                        &nbsp;
                        {incorrectCount ?? 0}
                    </div>
                    <button className={styles.cancelButton} onClick={onSetGameMode['discover']}>
                        Abbrechen
                    </button>
                </div>
            </>
        )}
    </div>
);
