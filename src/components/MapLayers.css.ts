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

export const zone = style({
    fill: 'transparent',
    stroke: '#95a5a6',
    strokeWidth: '0.4px',
    strokeDasharray: '2 1',
    pointerEvents: 'none',
});

export const iconGroup = style({
    cursor: 'pointer',
    pointerEvents: 'all',
});

export const iconCircle = style({
    fill: 'white',
    stroke: '#2c3e50',
    strokeWidth: 1,
    opacity: 0.95,
    vectorEffect: 'non-scaling-stroke',
});

export const iconText = style({
    fill: '#2c3e50',
    textAnchor: 'middle',
    dominantBaseline: 'central',
    pointerEvents: 'none',
});
