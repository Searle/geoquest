import { useState } from 'react';
import AfricaMap from './components/AfricaMap';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>GeoGuess - Afrika</h1>
      </header>
      <main className="app-main">
        <AfricaMap />
      </main>
    </div>
  );
}

export default App;
