import { alpha, Theme, Components } from '@mui/material/styles';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';
import { svgIconClasses } from '@mui/material/SvgIcon';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import CheckBoxOutlineBlankRoundedIcon from '@mui/icons-material/CheckBoxOutlineBlankRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { brand, gray, green, interactionColors, orange, red } from '../themePrimitives.ts';

declare module '@mui/material/Button' {
    interface ButtonPropsVariantOverrides {
        tonal: true;
    }
}

export const inputsCustomizations: Components<Theme> = {
    MuiButtonBase: {
        defaultProps: {
            disableTouchRipple: true,
            disableRipple: true,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                boxSizing: 'border-box',
                transition: 'all 100ms ease-in',
                '&:focus-visible': {
                    outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    outlineOffset: '2px',
                },
            }),
        },
    },
    MuiButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                boxShadow: 'none',
                borderRadius: (theme.vars || theme).shape.borderRadius,
                textTransform: 'none',
                fontWeight: 650,
                letterSpacing: '-0.01em',
                '@media (pointer: coarse)': {
                    minHeight: 44,
                },
                variants: [
                    {
                        props: {
                            size: 'small',
                        },
                        style: {
                            height: '2.25rem',
                            padding: '8px 12px',
                        },
                    },
                    {
                        props: {
                            size: 'medium',
                        },
                        style: {
                            height: '2.625rem',
                        },
                    },
                    {
                        props: {
                            color: 'primary',
                            variant: 'contained',
                        },
                        style: {
                            color: brand[50],
                            backgroundColor: brand[500],
                            backgroundImage: 'none',
                            boxShadow: '0 4px 14px hsla(342, 72%, 42%, 0.25)',
                            border: '1px solid transparent',
                            '&:hover': {
                                backgroundColor: brand[600],
                                borderColor: brand[600],
                                boxShadow: '0 6px 18px hsla(342, 72%, 42%, 0.3)',
                            },
                            '&:active': {
                                backgroundColor: brand[700],
                            },
                            ...theme.applyStyles('dark', {
                                color: brand[900],
                                backgroundColor: brand[400],
                                backgroundImage: 'none',
                                boxShadow: '0 4px 16px hsla(342, 80%, 45%, 0.22)',
                                border: '1px solid transparent',
                                '&:hover': {
                                    backgroundImage: 'none',
                                    backgroundColor: brand[300],
                                    boxShadow: '0 6px 20px hsla(342, 80%, 45%, 0.28)',
                                },
                                '&:active': {
                                    backgroundColor: brand[200],
                                },
                            }),
                        },
                    },
                    {
                        props: { variant: 'tonal' },
                        style: {
                            color: brand[700],
                            backgroundColor: brand[100],
                            border: '1px solid transparent',
                            '&:hover': { backgroundColor: brand[200] },
                            '&:active': { backgroundColor: brand[200] },
                            ...theme.applyStyles('dark', {
                                color: brand[400],
                                backgroundColor: 'hsl(342, 32%, 19%)',
                                '&:hover': { backgroundColor: 'hsl(342, 34%, 23%)' },
                            }),
                        },
                    },
                    {
                        props: {
                            color: 'secondary',
                            variant: 'contained',
                        },
                        style: {
                            color: gray[900],
                            backgroundColor: orange[500],
                            backgroundImage: 'none',
                            boxShadow: 'none',
                            border: '1px solid transparent',
                            '&:hover': {
                                backgroundColor: orange[600],
                                boxShadow: 'none',
                            },
                            '&:active': {
                                backgroundColor: orange[700],
                                backgroundImage: 'none',
                            },
                            ...theme.applyStyles('dark', {
                                color: gray[900],
                                backgroundColor: orange[400],
                                '&:hover': { backgroundColor: orange[300] },
                                '&:active': { backgroundColor: orange[500] },
                            }),
                        },
                    },
                    {
                        props: {
                            color: 'primary',
                            variant: 'outlined',
                        },
                        style: {
                            color: (theme.vars || theme).palette.text.primary,
                            border: '1.5px solid',
                            borderColor: (theme.vars || theme).palette.divider,
                            backgroundColor: (theme.vars || theme).palette.background.paper,
                            '&:hover': {
                                backgroundColor: brand[100],
                                borderColor: brand[200],
                            },
                            '&:active': {
                                backgroundColor: gray[200],
                            },
                            ...theme.applyStyles('dark', {
                                backgroundColor: 'transparent',
                                borderColor: interactionColors.dark.outlinedBorder,

                                '&:hover': {
                                    backgroundColor: 'hsl(342, 32%, 19%)',
                                    borderColor: brand[400],
                                },
                                '&:active': {
                                    backgroundColor: gray[900],
                                },
                            }),
                        },
                    },
                    {
                        props: {
                            color: 'secondary',
                            variant: 'outlined',
                        },
                        style: {
                            color: orange[700],
                            border: '1px solid',
                            borderColor: orange[200],
                            backgroundColor: orange[50],
                            '&:hover': {
                                backgroundColor: orange[100],
                                borderColor: orange[500],
                            },
                            '&:active': {
                                backgroundColor: orange[200],
                            },
                            ...theme.applyStyles('dark', {
                                color: orange[400],
                                border: '1px solid',
                                borderColor: orange[700],
                                backgroundColor: orange[900],
                                '&:hover': {
                                    borderColor: orange[400],
                                    backgroundColor: orange[800],
                                },
                                '&:active': {
                                    backgroundColor: orange[700],
                                },
                            }),
                        },
                    },
                    {
                        props: {
                            color: 'primary',
                            variant: 'text',
                        },
                        style: {
                            color: gray[600],
                            '&:hover': {
                                backgroundColor: gray[100],
                            },
                            '&:active': {
                                backgroundColor: gray[200],
                            },
                            ...theme.applyStyles('dark', {
                                color: gray[50],
                                '&:hover': {
                                    backgroundColor: gray[700],
                                },
                                '&:active': {
                                    backgroundColor: alpha(gray[700], 0.7),
                                },
                            }),
                        },
                    },
                    {
                        props: {
                            color: 'secondary',
                            variant: 'text',
                        },
                        style: {
                            color: orange[700],
                            '&:hover': {
                                backgroundColor: alpha(orange[100], 0.7),
                            },
                            '&:active': {
                                backgroundColor: orange[200],
                            },
                            ...theme.applyStyles('dark', {
                                color: orange[400],
                                '&:hover': {
                                    backgroundColor: orange[900],
                                },
                                '&:active': {
                                    backgroundColor: orange[800],
                                },
                            }),
                        },
                    },
                ],
            }),
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                boxShadow: 'none',
                borderRadius: (theme.vars || theme).shape.borderRadius,
                textTransform: 'none',
                fontWeight: theme.typography.fontWeightMedium,
                letterSpacing: 0,
                color: (theme.vars || theme).palette.text.primary,
                border: '1px solid ',
                borderColor: gray[200],
                backgroundColor: (theme.vars || theme).palette.background.paper,
                '&:hover': {
                    backgroundColor: gray[100],
                    borderColor: gray[300],
                },
                '&:active': {
                    backgroundColor: gray[200],
                },
                ...theme.applyStyles('dark', {
                    backgroundColor: gray[800],
                    borderColor: gray[600],
                    '&:hover': {
                        backgroundColor: gray[900],
                        borderColor: gray[600],
                    },
                    '&:active': {
                        backgroundColor: gray[900],
                    },
                }),
                variants: [
                    {
                        props: {
                            size: 'small',
                        },
                        style: {
                            width: '2.25rem',
                            height: '2.25rem',
                            padding: '0.25rem',
                            [`& .${svgIconClasses.root}`]: { fontSize: '1rem' },
                        },
                    },
                    {
                        props: {
                            size: 'medium',
                        },
                        style: {
                            width: '2.5rem',
                            height: '2.5rem',
                        },
                    },
                    {
                        props: { color: 'primary' },
                        style: {
                            color: brand[500],
                            ...theme.applyStyles('dark', { color: brand[400] }),
                        },
                    },
                    {
                        props: { color: 'secondary' },
                        style: {
                            color: orange[500],
                            ...theme.applyStyles('dark', { color: orange[400] }),
                        },
                    },
                    {
                        props: { color: 'error' },
                        style: {
                            color: red[500],
                            ...theme.applyStyles('dark', { color: red[300] }),
                        },
                    },
                    {
                        props: { color: 'success' },
                        style: {
                            color: green[500],
                            ...theme.applyStyles('dark', { color: green[400] }),
                        },
                    },
                ],
                '@media (pointer: coarse)': {
                    minWidth: 44,
                    minHeight: 44,
                },
                '&&[data-floating-action="true"]': {
                    color: interactionColors.light.floatingForeground,
                    backgroundColor: interactionColors.light.floatingBackground,
                    border: `1.5px solid ${brand[200]}`,
                    boxShadow: '0 4px 16px rgba(40, 20, 28, .24)',
                    '&:hover': {
                        color: brand[700],
                        backgroundColor: brand[100],
                        borderColor: brand[300],
                        transform: 'translateY(-1px)',
                    },
                    '&[aria-pressed="true"]': {
                        color: brand[500],
                        backgroundColor: brand[100],
                        borderColor: brand[300],
                    },
                },
            }),
        },
    },
    MuiToggleButtonGroup: {
        styleOverrides: {
            root: ({ theme }) => ({
                borderRadius: '999px',
                backgroundColor: 'transparent',
                border: 'none',
                [`& .${toggleButtonGroupClasses.selected}`]: {
                    color: brand[500],
                },
                ...theme.applyStyles('dark', {
                    [`& .${toggleButtonGroupClasses.selected}`]: {
                        color: brand[200],
                    },
                    backgroundColor: 'transparent',
                    border: 'none',
                }),
            }),
        },
    },
    MuiToggleButton: {
        styleOverrides: {
            root: ({ theme }) => ({
                padding: '6px 14px',
                minHeight: 32,
                textTransform: 'none',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: gray[100],
                color: gray[500],
                fontWeight: 600,
                '@media (pointer: coarse)': {
                    minHeight: 44,
                },
                '&.Mui-selected': {
                    backgroundColor: brand[500],
                    color: brand[50],
                },
                '&.Mui-selected:hover': {
                    backgroundColor: brand[600],
                },
                ...theme.applyStyles('dark', {
                    color: gray[400],
                    borderColor: 'transparent',
                    backgroundColor: gray[800],
                    [`&.${toggleButtonClasses.selected}`]: {
                        color: brand[900],
                        backgroundColor: brand[400],
                    },
                }),
            }),
        },
    },
    MuiCheckbox: {
        defaultProps: {
            disableRipple: true,
            icon: (
                <CheckBoxOutlineBlankRoundedIcon sx={{ color: 'hsla(210, 0%, 0%, 0.0)' }} />
            ),
            checkedIcon: <CheckRoundedIcon sx={{ height: 14, width: 14 }} />,
            indeterminateIcon: <RemoveRoundedIcon sx={{ height: 14, width: 14 }} />,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                margin: 10,
                height: 16,
                width: 16,
                borderRadius: 5,
                border: '1px solid ',
                borderColor: alpha(gray[300], 0.8),
                boxShadow: '0 0 0 1.5px hsla(210, 0%, 0%, 0.04) inset',
                backgroundColor: alpha(gray[100], 0.4),
                transition: 'border-color, background-color, 120ms ease-in',
                '&:hover': {
                    borderColor: brand[300],
                },
                '&.Mui-focusVisible': {
                    outline: `3px solid ${alpha(brand[500], 0.5)}`,
                    outlineOffset: '2px',
                    borderColor: brand[400],
                },
                '&.Mui-checked': {
                    color: 'white',
                    backgroundColor: brand[500],
                    borderColor: brand[500],
                    boxShadow: `none`,
                    '&:hover': {
                        backgroundColor: brand[600],
                    },
                },
                ...theme.applyStyles('dark', {
                    borderColor: alpha(gray[700], 0.8),
                    boxShadow: '0 0 0 1.5px hsl(210, 0%, 0%) inset',
                    backgroundColor: alpha(gray[900], 0.8),
                    '&:hover': {
                        borderColor: brand[300],
                    },
                    '&.Mui-focusVisible': {
                        borderColor: brand[400],
                        outline: `3px solid ${alpha(brand[500], 0.5)}`,
                        outlineOffset: '2px',
                    },
                }),
            }),
        },
    },
    MuiInputBase: {
        styleOverrides: {
            root: {
                border: 'none',
            },
            input: {
                '&::placeholder': {
                    opacity: 1,
                    color: 'var(--template-palette-text-secondary)',
                },
            },
        },
    },
    // The template removes the notched outline below, so a floating label
    // would sit on top of the input border. Render labels statically above
    // the field instead — every TextField/Select label in the app gets this.
    MuiInputLabel: {
        styleOverrides: {
            root: ({ theme }) => ({
                position: 'static',
                transform: 'none',
                transition: 'none',
                pointerEvents: 'auto',
                maxWidth: 'none',
                marginBottom: 7,
                fontSize: 11,
                lineHeight: 1.2,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: (theme.vars || theme).palette.text.secondary,
            }),
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            input: {
                padding: 0,
            },
            root: ({ theme }) => ({
                padding: '8px 12px',
                color: (theme.vars || theme).palette.text.primary,
                borderRadius: (theme.vars || theme).shape.borderRadius,
                border: '1.5px solid transparent',
                backgroundColor: gray[100],
                transition: 'border 120ms ease-in',
                '&:hover': {
                    borderColor: gray[300],
                },
                [`&.${outlinedInputClasses.focused}`]: {
                    outline: `3px solid ${alpha(brand[500], 0.18)}`,
                    borderColor: brand[500],
                    backgroundColor: (theme.vars || theme).palette.background.paper,
                },
                '&.Mui-error': {
                    borderColor: (theme.vars || theme).palette.error.main,
                    backgroundColor: alpha(theme.palette.error.main, 0.04),
                },
                '&.Mui-error:hover': {
                    borderColor: (theme.vars || theme).palette.error.dark,
                },
                [`&.Mui-error.${outlinedInputClasses.focused}`]: {
                    borderColor: (theme.vars || theme).palette.error.main,
                    outline: `3px solid ${alpha(theme.palette.error.main, 0.2)}`,
                },
                ...theme.applyStyles('dark', {
                    backgroundColor: gray[800],
                    '&:hover': {
                        borderColor: gray[600],
                    },
                    [`&.${outlinedInputClasses.focused}`]: {
                        borderColor: brand[400],
                        backgroundColor: 'hsl(336, 12%, 12%)',
                    },
                }),
                variants: [
                    {
                        props: {
                            size: 'small',
                        },
                        style: {
                            height: '2.25rem',
                        },
                    },
                    {
                        props: {
                            size: 'medium',
                        },
                        style: {
                            height: '2.5rem',
                        },
                    },
                ],
                // The fixed heights above would squash multiline fields
                // (textarea) down to a single line.
                '&.MuiInputBase-multiline': {
                    height: 'auto',
                },
            }),
            notchedOutline: {
                border: 'none',
            },
        },
    },
    MuiInputAdornment: {
        styleOverrides: {
            root: ({ theme }) => ({
                color: (theme.vars || theme).palette.grey[500],
                ...theme.applyStyles('dark', {
                    color: (theme.vars || theme).palette.grey[400],
                }),
            }),
        },
    },
    MuiFormLabel: {
        styleOverrides: {
            root: ({ theme }) => ({
                typography: theme.typography.caption,
                marginBottom: 8,
            }),
        },
    },
};
