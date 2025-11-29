import { useEffect } from 'react';
import confetti from 'canvas-confetti';

import type { GameMode } from '../types/game.js';

import * as styles from './GameCompleted.css.ts';

interface GameCompletedProps {
    gameMode: GameMode;
    incorrectCount: number;
    onRestart: () => void;
}

const getPerformanceMessage = (incorrectCount: number) => {
    if (incorrectCount === 0) return { emoji: '🏆', message: 'Perfekt!' };
    if (incorrectCount <= 10) return { emoji: '🥈', message: 'Sehr gut!' };
    if (incorrectCount <= 20) return { emoji: '🥉', message: 'Gut gemacht!' };
    return { emoji: '⭐', message: 'Geschafft!' };
};

// Calculate confetti intensity based on incorrectCount (0-30)
// Better performance = more confetti, using square function for logarithmic feel
const getConfettiCount = (incorrectCount: number): number => {
    // Clamp to 0-30 range
    const clamped = Math.min(Math.max(incorrectCount, 0), 30);
    // Invert so 0 errors = 30, 30 errors = 0
    const inverted = 30 - clamped;
    // Square for more dramatic difference: 0-900, then scale to reasonable particle count
    const squared = inverted * inverted;
    // Scale to 20-200 particles
    return Math.floor(20 + (squared / 900) * 180);
};

export const GameCompleted = ({ incorrectCount, onRestart }: GameCompletedProps) => {
    const { emoji, message } = getPerformanceMessage(incorrectCount);

    useEffect(() => {
        const particleCount = getConfettiCount(incorrectCount);

        // Fire confetti
        confetti({
            particleCount,
            spread: 70,
            decay: 0.95,
            origin: { y: 0.6 },
        });
    }, [incorrectCount]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.heading}>
                    {emoji} {message}
                </h2>
                <div className={styles.score}>
                    <div>Fehlversuche: {incorrectCount}</div>
                </div>
                <button onClick={onRestart}>Nochmal starten</button>
            </div>
        </div>
    );
};
