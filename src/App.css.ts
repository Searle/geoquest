import { style, globalStyle } from '@vanilla-extract/css';

// Global styles
globalStyle('*', {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
});

globalStyle('body', {
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    backgroundColor: '#f5f5f5',
});

globalStyle('select', {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    border: '2px solid #3498db',
    backgroundColor: 'white',
    color: '#3498db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
});

globalStyle('button', {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    border: '4px solid #b1e0ff',
    backgroundColor: 'white',
    color: '#3498db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
});

globalStyle('button:hover:not(:disabled)', {
    backgroundColor: '#ecf0f1',
    transform: 'translateY(-1px)',
});

globalStyle('button.active', {
    backgroundColor: '#3498db',
    color: 'white',
});

globalStyle('button:disabled', {
    opacity: 0.5,
    cursor: 'not-allowed',
});

export const app = style({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
});
