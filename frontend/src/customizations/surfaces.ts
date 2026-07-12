import { alpha, Theme, Components } from '@mui/material/styles';
import { gray } from '../themePrimitives.ts';

export const surfacesCustomizations: Components<Theme> = {
    MuiAccordion: {
        defaultProps: {
            elevation: 0,
            disableGutters: true,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                padding: 4,
                overflow: 'clip',
                backgroundColor: (theme.vars || theme).palette.background.default,
                border: '1px solid',
                borderColor: (theme.vars || theme).palette.divider,
                ':before': {
                    backgroundColor: 'transparent',
                },
                '&:not(:last-of-type)': {
                    borderBottom: 'none',
                },
                '&:first-of-type': {
                    borderTopLeftRadius: (theme.vars || theme).shape.borderRadius,
                    borderTopRightRadius: (theme.vars || theme).shape.borderRadius,
                },
                '&:last-of-type': {
                    borderBottomLeftRadius: (theme.vars || theme).shape.borderRadius,
                    borderBottomRightRadius: (theme.vars || theme).shape.borderRadius,
                },
            }),
        },
    },
    MuiAccordionSummary: {
        styleOverrides: {
            root: ({ theme }) => ({
                border: 'none',
                borderRadius: 8,
                '&:hover': { backgroundColor: gray[50] },
                '&:focus-visible': { backgroundColor: 'transparent' },
                ...theme.applyStyles('dark', {
                    '&:hover': { backgroundColor: gray[800] },
                }),
            }),
        },
    },
    MuiAccordionDetails: {
        styleOverrides: {
            root: { mb: 20, border: 'none' },
        },
    },
    MuiPaper: {
        defaultProps: {
            elevation: 0,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                backgroundImage: 'none',
                borderRadius: 16,
                variants: [
                    {
                        props: { variant: 'outlined' },
                        style: {
                            border: `1px solid ${(theme.vars || theme).palette.divider}`,
                        },
                    },
                ],
            }),
        },
    },
    MuiCard: {
        styleOverrides: {
            root: ({ theme }) => {
                return {
                    transition: 'all 100ms ease',
                    backgroundColor: (theme.vars || theme).palette.background.paper,
                    borderRadius: 16,
                    border: `1px solid ${(theme.vars || theme).palette.divider}`,
                    boxShadow: 'none',
                    overflow: 'hidden',
                    ...theme.applyStyles('dark', {
                        backgroundColor: 'hsl(336, 12%, 12%)',
                    }),
                    variants: [
                        {
                            props: {
                                variant: 'outlined',
                            },
                            style: {
                                border: `1px solid ${(theme.vars || theme).palette.divider}`,
                                boxShadow: 'none',
                                background: 'hsl(0, 0%, 100%)',
                                ...theme.applyStyles('dark', {
                                    background: alpha(gray[900], 0.4),
                                }),
                            },
                        },
                    ],
                };
            },
        },
    },
    MuiCardContent: {
        styleOverrides: {
            root: {
                padding: 0,
                '&:last-child': { paddingBottom: 0 },
            },
        },
    },
    MuiCardHeader: {
        styleOverrides: {
            root: {
                padding: 0,
            },
        },
    },
    MuiCardActions: {
        styleOverrides: {
            root: {
                padding: 0,
            },
        },
    },
};
