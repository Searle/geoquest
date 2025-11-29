import { style, globalStyle, keyframes } from '@vanilla-extract/css';

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
    minHeight: 400,
    fontSize: '1.2rem',
    color: '#7f8c8d',
});

const zoomBorderAnimation = keyframes({
    '0%': {
        margin: '30%',
    },
    '100%': {
        margin: '0px',
    },
});

const zoomBorderCloseAnimation = keyframes({
    '0%': {
        margin: '0px',
    },
    '100%': {
        margin: '30%',
    },
});

const zoomBorderBase = style({
    position: 'absolute',
    top: 40,
    left: 10,
    right: 30,
    bottom: 10,
    border: '2px dotted #000000',
    pointerEvents: 'none',
    zIndex: 9,
});

export const zoomBorder = style([
    zoomBorderBase,
    {
        animation: `${zoomBorderAnimation} 0.2s ease-out`,
    },
]);

export const zoomBorderClosing = style([
    zoomBorderBase,
    {
        animation: `${zoomBorderCloseAnimation} 0.2s ease-in`,
    },
]);

export const zoomButtonContainer = style({
    position: 'absolute',
    top: '20px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
});

export const zoomButton = style({
    zIndex: 10,
    paddingLeft: 16,
});
