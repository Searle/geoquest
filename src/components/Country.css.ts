import { style } from '@vanilla-extract/css';

export const country = style({
    fill: '#3498db',
    stroke: '#2c3e50',
    strokeWidth: '1px',
    cursor: 'pointer',
});

export const hovered = style({
    fill: '#51b6fa',
    strokeWidth: '2px',
});

export const quizTarget = style({
    fill: '#7bed9f',
    stroke: '#2ed573',
});

export const quizIncorrect = style({
    fill: '#e74c3c',
    stroke: '#7e2a21',
});

export const hitArea = style({
    fill: 'transparent',
    stroke: 'transparent',
    vectorEffect: 'non-scaling-stroke',
});

export const noPointer = style({
    pointerEvents: 'none',
});
