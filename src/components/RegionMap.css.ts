import { style, globalStyle } from '@vanilla-extract/css';

export const container = style({
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
});

export const inner = style({
    position: 'relative',
    overflowY: 'scroll',
    overflowX: 'hidden',
    flex: 1,
});

globalStyle(`${inner} > svg`, {
    paddingTop: '1rem',
});

export const loading = style({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '1.2rem',
    color: '#7f8c8d',
});

export const zoomButtonContainer = style({
    position: 'absolute',
    top: '20px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
});

export const zoomButton = style({
    background: '#2c3e50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    transition: 'background 0.2s ease',
    zIndex: 10,
    ':hover': {
        background: '#34495e',
    },
    ':active': {
        background: '#1a252f',
    },
});
