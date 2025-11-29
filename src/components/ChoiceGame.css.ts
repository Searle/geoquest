import { style, keyframes } from '@vanilla-extract/css';

const slideIn = keyframes({
    from: {
        opacity: 0,
        transform: 'translateY(-10px)',
    },
    to: {
        opacity: 1,
        transform: 'translateY(0)',
    },
});

export const container = style({
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    height: '100%',
    overflow: 'hidden',
});

export const loading = style({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '1.2rem',
    color: '#7f8c8d',
});

export const area = style({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#ecf0f1',
    borderRadius: '12px',
});

export const questionArea = style({
    width: '40%',
    padding: 0,
    backgroundColor: 'transparent',
});

export const questions = style({
    flex: 'none',
});

export const answerArea = style({
    overflow: 'hidden',
});

export const title = style({
    fontSize: '1rem',
    color: '#acbfd1',
    margin: 0,
    fontWeight: 600,
});

export const list = style({
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
});

export const item = style({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    animation: `${slideIn} 0.3s ease`,
});

export const itemCorrect = style({
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    border: '2px solid #2ecc71',
});

export const itemIncorrect = style({
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    border: '2px solid #e74c3c',
});

export const itemCountry = style({
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#2c3e50',
});

export const itemCapital = style({
    fontSize: '1rem',
    color: '#34495e',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
});

export const itemMarkCorrect = style({
    fontWeight: 900,
    color: '#2ecc71',
    fontSize: '1.2rem',
});

export const itemMarkIncorrect = style({
    fontWeight: 900,
    color: '#e74c3c',
    fontSize: '1.2rem',
});

export const itemAnswer = style({
    color: '#7f8c8d',
    fontStyle: 'italic',
    fontSize: '0.9rem',
});
