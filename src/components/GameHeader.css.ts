import { style, globalStyle } from '@vanilla-extract/css';

export const header = style({
    display: 'flex',
    marginBottom: '12px',
    backgroundColor: '#3498db',
    color: '#b1e0ff',
    justifyContent: 'space-between',
    padding: '0 1rem',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
});

export const game = style({
    backgroundColor: '#1471b0',
});

export const item = style({
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    height: '80px',
});

export const cancelButton = style({
    backgroundColor: '#449dda',
    borderColor: '#62b9f2',
    color: '#a4dbff',
    marginLeft: '20px',
});

export const question = style({
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#ecf0f1',
});

export const label = style({
    paddingLeft: '10px',
    paddingTop: '1px',
});

export const score = style({
    padding: '0.5rem 1rem 0.5rem 0.7rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    textWrap: 'nowrap',
});

globalStyle(`${score} .correct`, {
    fontWeight: 900,
    color: '#59fea1',
});

globalStyle(`${score} .incorrect`, {
    color: '#ffdbd8',
});
