import { style, globalStyle } from '@vanilla-extract/css';

export const container = style({
    position: 'relative',
    width: '100%',
    maxWidth: '1000px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100vh',
    alignSelf: 'center',
});

export const content = style({
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
});

export const completed = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem',
    backgroundColor: '#ecf0f1',
});

globalStyle(`${completed} h2`, {
    margin: '0 0 1.5rem 0',
    color: '#2c3e50',
    fontSize: '2rem',
});

export const score = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    fontSize: '1.2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#2c3e50',
});

globalStyle(`${score} div`, {
    fontWeight: 600,
});
