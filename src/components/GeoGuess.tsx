import { useCallback, useState, useEffect } from 'react';

import type { CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useMapGame } from '../hooks/useMapGame.js';
import { useChoiceGame } from '../hooks/useChoiceGame.js';
import { ChoiceGame } from './ChoiceGame.js';
import { MapGame } from './MapGame.js';
import type { GameMode, OnSetGameMode } from '../types/game.js';
import { initializeTTS } from '../utils/textToSpeech.js';

import './GeoGuess.css';

const GeoGuess = () => {
    const [region, setRegion] = useState<Region>('Africa');
    const [gameMode, setGameMode] = useState<GameMode>('discover');
    const [countries, setCountries] = useState<CountryData[]>([]);

    // Initialize TTS on component mount for faster first use
    useEffect(() => {
        initializeTTS();
    }, []);

    const handleRegionChange = (region: string) => {
        setRegion(region as Region);
    };

    const mapGame = useMapGame(countries);
    const choiceGame = useChoiceGame(countries);

    const handleSetGameMode: OnSetGameMode = {
        discover: () => {
            mapGame.resetQuiz();
            choiceGame.resetQuiz();
            setGameMode('discover');
        },
        'map-country': () => {
            mapGame.startQuiz();
            setGameMode('map-country');
        },
        'map-capital': () => {
            mapGame.startQuiz();
            setGameMode('map-capital');
        },
        'choice-capital': () => {
            choiceGame.startQuiz('choice-capital');
            setGameMode('choice-capital');
        },
        'choice-country': () => {
            choiceGame.startQuiz('choice-country');
            setGameMode('choice-country');
        },
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
            {/* Choice Game Components */}
            {(gameMode === 'choice-capital' || gameMode === 'choice-country') && (
                <ChoiceGame
                    gameMode={gameMode}
                    choiceGame={choiceGame}
                    countries={countries}
                    region={region}
                    onRegionChange={handleRegionChange}
                    onSetGameMode={handleSetGameMode}
                />
            )}

            {/* Map component */}
            {(gameMode === 'discover' || gameMode === 'map-country' || gameMode === 'map-capital') && (
                <MapGame
                    gameMode={gameMode}
                    mapGame={mapGame}
                    countries={countries}
                    region={region}
                    onSetGameMode={handleSetGameMode}
                    isCompleted={mapGame.isCompleted}
                    onCountriesLoaded={handleCountriesLoaded}
                    onRegionChange={handleRegionChange}
                />
            )}
        </div>
    );
};

export default GeoGuess;
