export type GameMode = 'discover' | 'map-country' | 'map-capital' | 'choice-capital' | 'choice-country';

export const regions = ['Americas', 'Asia', 'Africa', 'Europe', 'Oceania', 'Antarctic'];

export type OnSetGameMode = Record<GameMode, () => void>;
