import { style } from '@vanilla-extract/css';

export const svg = style({
    display: 'block',
    width: '100%',
    height: 'auto',
});

export const overlay = style({
    display: 'block',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 'auto',
});

export const shadow = style({
    filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))',
});

export const noEvents = style({
    pointerEvents: 'none',
});
