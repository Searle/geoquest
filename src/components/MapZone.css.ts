import { style } from '@vanilla-extract/css';

export const zone = style({
    fill: 'transparent',
    stroke: '#95a5a6',
    strokeWidth: '0.4px',
    strokeDasharray: '2 1',
    pointerEvents: 'none',
});

export const zoneHover = style({
    stroke: '#000000',
    strokeWidth: '1px',
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
