import { useState } from 'react';

import GameMap from './components/GameMap.js';
import type { Region } from './types/countries-json.js';

import './App.css';

const regions = ['Americas', 'Asia', 'Africa', 'Europe', 'Oceania', 'Antarctic'];

function App() {
    const [region, setRegion] = useState<Region>('Africa');

    const handleRegionChange = (region: string) => {
        setRegion(region as Region);
    };

    return (
        <div className='app'>
            <header className='app-header'>
                <select value={region} onChange={(e) => handleRegionChange(e.target.value)}>
                    {regions.map((r) => (
                        <option key={r}>{r}</option>
                    ))}
                </select>
            </header>
            <main className='app-main'>
                <GameMap region={region} />
            </main>
        </div>
    );
}

export default App;
