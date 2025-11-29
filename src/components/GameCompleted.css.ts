import { style, keyframes } from '@vanilla-extract/css';

const fadeInScale = keyframes({
    from: {
        opacity: 0,
        transform: 'scale(0.9)',
    },
    to: {
        opacity: 1,
        transform: 'scale(1)',
    },
});

export const container = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
});

export const card = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    animation: `${fadeInScale} 0.4s ease-out`,
});

export const heading = style({
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#2c3e50',
    textAlign: 'center',
    margin: 0,
});

export const score = style({
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#2c3e50',
    textAlign: 'center',
});
