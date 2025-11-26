import { useCallback, useState } from 'react';

import type { CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useMapGame } from '../hooks/useMapGame.js';
import { useChoiceGame } from '../hooks/useChoiceGame.js';
import { ChoiceGame } from './ChoiceGame.js';
import { MapGame } from './MapGame.js';
import type { GameMode } from '../types/game.js';

import './GeoGuess.css';

const GeoGuess = () => {
    const [region, setRegion] = useState<Region>('Africa');
    const [gameMode, setGameMode] = useState<GameMode>('discover');
    const [countries, setCountries] = useState<CountryData[]>([]);

    const handleRegionChange = (region: string) => {
        setRegion(region as Region);
    };

    const mapGame = useMapGame(countries);
    const choiceGame = useChoiceGame(countries);

    // Mode switching
    const handleStartCountryMapGame = () => {
        mapGame.startQuiz();
        setGameMode('map-country');
    };

    const handleStartCapitalMapGame = () => {
        mapGame.startQuiz();
        setGameMode('map-capital');
    };

    const handleStartCapitalChoiceGame = () => {
        choiceGame.startQuiz();
        setGameMode('choice-capital');
    };

    const handleStartDiscover = () => {
        mapGame.resetQuiz();
        choiceGame.resetQuiz();
        setGameMode('discover');
    };

    // Pass countries up from MapGame
    const handleCountriesLoaded = useCallback(
        (loadedCountries: CountryData[]) => {
            setCountries(loadedCountries);
        },
        [setCountries],
    );

    return (
        <div className='geo-guess'>
            {/* Capital Choice Component */}
            {gameMode === 'choice-capital' && (
                <ChoiceGame
                    gameMode={gameMode}
                    choiceGame={choiceGame}
                    countries={countries}
                    region={region}
                    onRestart={handleStartCapitalChoiceGame}
                    onRegionChange={handleRegionChange}
                    onStartCountryMapGame={handleStartCountryMapGame}
                    onStartCapitalMapGame={handleStartCapitalMapGame}
                    onStartCapitalChoiceGame={handleStartCapitalChoiceGame}
                    onStartDiscover={handleStartDiscover}
                />
            )}

            {/* Map component */}
            {(gameMode === 'discover' || gameMode === 'map-country' || gameMode === 'map-capital') && (
                <MapGame
                    gameMode={gameMode}
                    mapGame={mapGame}
                    region={region}
                    countries={countries}
                    isCompleted={mapGame.isCompleted}
                    onCountriesLoaded={handleCountriesLoaded}
                    onRestart={gameMode === 'map-capital' ? handleStartCapitalMapGame : handleStartCountryMapGame}
                    onRegionChange={handleRegionChange}
                    onStartCountryMapGame={handleStartCountryMapGame}
                    onStartCapitalMapGame={handleStartCapitalMapGame}
                    onStartCapitalChoiceGame={handleStartCapitalChoiceGame}
                    onStartDiscover={handleStartDiscover}
                />
            )}
        </div>
    );
};

export default GeoGuess;
