import { style, keyframes } from '@vanilla-extract/css';

const fadeIn = keyframes({
    from: {
        opacity: 0,
    },
    to: {
        opacity: 1,
    },
});

export const tooltip = style({
    position: 'fixed',
    left: 'var(--tooltip-x)',
    top: 'var(--tooltip-y)',
    backgroundColor: 'rgba(44, 62, 80, 0.95)',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    pointerEvents: 'none',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    fontSize: '0.95rem',
    minWidth: '200px',
});

export const tooltipName = style({
    fontWeight: 600,
    fontSize: '1.1rem',
    marginBottom: '0.25rem',
    color: '#ecf0f1',
});

export const tooltipCca3 = style({
    display: 'inline-block',
    paddingLeft: '10px',
    fontWeight: 100,
    fontSize: '0.8rem',
    opacity: 0.3,
});

export const tooltipCapital = style({
    color: '#bdc3c7',
    fontSize: '0.9rem',
});

export const dismissOverlay = style({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    cursor: 'no-drop',
});

export const incorrectLabel = style({
    position: 'fixed',
    left: 'var(--label-x)',
    top: 'var(--label-y)',
    backgroundColor: 'rgba(231, 76, 60, 0.7)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    pointerEvents: 'none',
    zIndex: 1001,
    fontSize: '1rem',
    fontWeight: 600,
    transform: 'translateX(-50%)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    animation: `${fadeIn} 0.2s ease`,
});

export const incorrectLabelCapital = style({
    fontSize: '1em',
    fontWeight: 'bold',
});

export const incorrectLabelCountry = style({
    fontSize: '0.8em',
    opacity: 0.8,
});
