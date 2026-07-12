import { Theme, Components } from '@mui/material/styles';
import { gray } from '../themePrimitives.ts';

export const feedbackCustomizations: Components<Theme> = {
    MuiAlert: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: (theme.vars || theme).shape.borderRadius,
                alignItems: 'center',
            }),
        },
    },
    MuiDialog: {
        styleOverrides: {
            root: ({ theme }) => ({
                '& .MuiDialog-paper': {
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: (theme.vars || theme).palette.divider,
                },
            }),
        },
    },
    MuiLinearProgress: {
        styleOverrides: {
            root: ({ theme }) => ({
                height: 8,
                borderRadius: 8,
                backgroundColor: gray[200],
                ...theme.applyStyles('dark', {
                    backgroundColor: gray[800],
                }),
            }),
        },
    },
};
