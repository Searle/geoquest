export type GameMode = 'discover' | 'map-country' | 'map-capital' | 'choice-country' | 'choice-capital';

export const regions = ['Americas', 'Asia', 'Africa', 'Europe', 'Oceania', 'Antarctic'];

export type OnSetGameMode = Record<GameMode, () => void>;
