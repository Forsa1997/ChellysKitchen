import { createTheme, alpha, PaletteMode, Shadows } from '@mui/material/styles';

declare module '@mui/material/Paper' {
    interface PaperPropsVariantOverrides {
        highlighted: true;
    }
}
declare module '@mui/material/styles' {
    interface ColorRange {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    }

    interface Palette {
        baseShadow: string;
    }
}

const defaultTheme = createTheme();

const customShadows: Shadows = [...defaultTheme.shadows];

export const brand = {
    50: 'hsl(342, 85%, 98%)',
    100: 'hsl(342, 75%, 95%)',
    200: 'hsl(342, 78%, 88%)',
    300: 'hsl(342, 80%, 76%)',
    400: 'hsl(342, 80%, 68%)',
    500: 'hsl(342, 72%, 42%)',
    600: 'hsl(342, 74%, 36%)',
    700: 'hsl(342, 70%, 30%)',
    800: 'hsl(342, 48%, 20%)',
    900: 'hsl(342, 60%, 10%)',
};

export const gray = {
    50: 'hsl(30, 45%, 97%)',
    100: 'hsl(30, 28%, 95%)',
    200: 'hsl(30, 18%, 88%)',
    300: 'hsl(30, 14%, 80%)',
    400: 'hsl(335, 8%, 64%)',
    500: 'hsl(340, 8%, 44%)',
    600: 'hsl(340, 12%, 34%)',
    700: 'hsl(336, 10%, 21%)',
    800: 'hsl(336, 10%, 16%)',
    900: 'hsl(336, 14%, 8%)',
};

export const green = {
    50: 'hsl(145, 35%, 96%)',
    100: 'hsl(145, 35%, 92%)',
    200: 'hsl(145, 34%, 84%)',
    300: 'hsl(145, 38%, 72%)',
    400: 'hsl(145, 38%, 62%)',
    500: 'hsl(145, 38%, 32%)',
    600: 'hsl(145, 42%, 26%)',
    700: 'hsl(145, 36%, 22%)',
    800: 'hsl(145, 28%, 18%)',
    900: 'hsl(145, 22%, 15%)',
};

export const orange = {
    50: 'hsl(32, 90%, 96%)',
    100: 'hsl(32, 90%, 92%)',
    200: 'hsl(30, 88%, 82%)',
    300: 'hsl(30, 90%, 70%)',
    400: 'hsl(30, 90%, 64%)',
    500: 'hsl(26, 85%, 45%)',
    600: 'hsl(26, 86%, 37%)',
    700: 'hsl(28, 72%, 28%)',
    800: 'hsl(30, 52%, 21%)',
    900: 'hsl(30, 45%, 16%)',
};

export const red = {
    50: 'hsl(0, 100%, 97%)',
    100: 'hsl(0, 92%, 90%)',
    200: 'hsl(0, 94%, 80%)',
    300: 'hsl(0, 90%, 65%)',
    400: 'hsl(0, 90%, 40%)',
    500: 'hsl(0, 90%, 30%)',
    600: 'hsl(0, 91%, 25%)',
    700: 'hsl(0, 94%, 18%)',
    800: 'hsl(0, 95%, 12%)',
    900: 'hsl(0, 93%, 6%)',
};

export const getDesignTokens = (mode: PaletteMode) => {
    customShadows[1] =
        mode === 'dark'
            ? 'hsla(336, 30%, 4%, 0.7) 0px 4px 16px 0px, hsla(336, 25%, 8%, 0.8) 0px 8px 16px -5px'
            : 'hsla(340, 25%, 14%, 0.07) 0px 4px 16px 0px, hsla(340, 25%, 14%, 0.07) 0px 8px 16px -5px';

    return {
        palette: {
            mode,
            primary: {
                light: brand[200],
                main: brand[500],
                dark: brand[700],
                contrastText: brand[50],
                ...(mode === 'dark' && {
                    contrastText: brand[900],
                    light: brand[300],
                    main: brand[400],
                    dark: brand[700],
                }),
            },
            secondary: {
                light: orange[100],
                main: orange[500],
                dark: orange[600],
                contrastText: gray[900],
                ...(mode === 'dark' && {
                    light: orange[300],
                    main: orange[400],
                    dark: orange[700],
                    contrastText: gray[900],
                }),
            },
            info: {
                light: brand[100],
                main: brand[300],
                dark: brand[600],
                contrastText: gray[50],
                ...(mode === 'dark' && {
                    contrastText: brand[300],
                    light: brand[500],
                    main: brand[700],
                    dark: brand[900],
                }),
            },
            warning: {
                light: orange[300],
                main: orange[400],
                dark: orange[800],
                ...(mode === 'dark' && {
                    light: orange[400],
                    main: orange[500],
                    dark: orange[700],
                }),
            },
            error: {
                light: red[300],
                main: red[400],
                dark: red[800],
                ...(mode === 'dark' && {
                    light: red[400],
                    main: red[500],
                    dark: red[700],
                }),
            },
            success: {
                light: green[300],
                main: green[500],
                dark: green[800],
                ...(mode === 'dark' && {
                    light: green[400],
                    main: green[400],
                    dark: green[700],
                }),
            },
            grey: {
                ...gray,
            },
            divider: mode === 'dark' ? gray[700] : gray[200],
            background: {
                default: gray[50],
                paper: 'hsl(0, 0%, 100%)',
                ...(mode === 'dark' && { default: gray[900], paper: 'hsl(336, 12%, 12%)' }),
            },
            text: {
                primary: 'hsl(340, 25%, 14%)',
                secondary: gray[500],
                warning: orange[400],
                ...(mode === 'dark' && { primary: 'hsl(30, 25%, 94%)', secondary: gray[400] }),
            },
            action: {
                hover: alpha(gray[200], 0.2),
                selected: `${alpha(gray[200], 0.3)}`,
                ...(mode === 'dark' && {
                    hover: alpha(gray[600], 0.2),
                    selected: alpha(gray[600], 0.3),
                }),
            },
        },
        typography: {
            fontFamily: '"Instrument Sans", sans-serif',
            h1: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(40),
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: 0,
            },
            h2: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(36),
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h3: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(30),
                lineHeight: 1.2,
            },
            h4: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(24),
                fontWeight: 600,
                lineHeight: 1.5,
            },
            h5: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(20),
                fontWeight: 600,
            },
            h6: {
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontSize: defaultTheme.typography.pxToRem(18),
                fontWeight: 600,
            },
            subtitle1: {
                fontSize: defaultTheme.typography.pxToRem(18),
            },
            subtitle2: {
                fontSize: defaultTheme.typography.pxToRem(14),
                fontWeight: 500,
            },
            body1: {
                fontSize: defaultTheme.typography.pxToRem(14),
            },
            body2: {
                fontSize: defaultTheme.typography.pxToRem(14),
                fontWeight: 400,
            },
            caption: {
                fontSize: defaultTheme.typography.pxToRem(12),
                fontWeight: 400,
            },
        },
        shape: {
            borderRadius: 12,
        },
        shadows: customShadows,
    };
};

export const colorSchemes = {
    light: {
        palette: {
            primary: {
                light: brand[200],
                main: brand[500],
                dark: brand[700],
                contrastText: brand[50],
            },
            secondary: {
                light: orange[100],
                main: orange[500],
                dark: orange[600],
                contrastText: gray[900],
            },
            info: {
                light: brand[100],
                main: brand[300],
                dark: brand[600],
                contrastText: gray[50],
            },
            warning: {
                light: orange[300],
                main: orange[400],
                dark: orange[800],
            },
            error: {
                light: red[300],
                main: red[400],
                dark: red[800],
            },
            success: {
                light: green[300],
                main: green[500],
                dark: green[800],
            },
            grey: {
                ...gray,
            },
            divider: gray[200],
            background: {
                default: gray[50],
                paper: 'hsl(0, 0%, 100%)',
            },
            text: {
                primary: 'hsl(340, 25%, 14%)',
                secondary: gray[500],
                warning: orange[400],
            },
            action: {
                hover: alpha(gray[200], 0.2),
                selected: `${alpha(gray[200], 0.3)}`,
            },
            baseShadow:
                'hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px',
        },
    },
    dark: {
        palette: {
            primary: {
                contrastText: brand[900],
                light: brand[300],
                main: brand[400],
                dark: brand[700],
            },
            info: {
                contrastText: brand[300],
                light: brand[500],
                main: brand[700],
                dark: brand[900],
            },
            warning: {
                light: orange[400],
                main: orange[500],
                dark: orange[700],
            },
            error: {
                light: red[400],
                main: red[500],
                dark: red[700],
            },
            success: {
                light: green[400],
                main: green[500],
                dark: green[700],
            },
            grey: {
                ...gray,
            },
            divider: gray[700],
            background: {
                default: gray[900],
                paper: 'hsl(336, 12%, 12%)',
            },
            text: {
                primary: 'hsl(30, 25%, 94%)',
                secondary: gray[400],
            },
            action: {
                hover: alpha(gray[600], 0.2),
                selected: alpha(gray[600], 0.3),
            },
            baseShadow:
                'hsla(220, 30%, 5%, 0.7) 0px 4px 16px 0px, hsla(220, 25%, 10%, 0.8) 0px 8px 16px -5px',
        },
    },
};

export const typography = {
    fontFamily: '"Instrument Sans", sans-serif',
    h1: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(40),
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: 0,
    },
    h2: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(36),
        fontWeight: 600,
        lineHeight: 1.2,
    },
    h3: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(30),
        lineHeight: 1.2,
    },
    h4: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(24),
        fontWeight: 600,
        lineHeight: 1.5,
    },
    h5: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(20),
        fontWeight: 600,
    },
    h6: {
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontSize: defaultTheme.typography.pxToRem(18),
        fontWeight: 600,
    },
    subtitle1: {
        fontSize: defaultTheme.typography.pxToRem(18),
    },
    subtitle2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 500,
    },
    body1: {
        fontSize: defaultTheme.typography.pxToRem(14),
    },
    body2: {
        fontSize: defaultTheme.typography.pxToRem(14),
        fontWeight: 400,
    },
    caption: {
        fontSize: defaultTheme.typography.pxToRem(12),
        fontWeight: 400,
    },
};

export const shape = {
    borderRadius: 12,
};

// @ts-expect-error CSS variable shadows are accepted by MUI at runtime.
const defaultShadows: Shadows = [
    'none',
    'var(--template-palette-baseShadow)',
    ...defaultTheme.shadows.slice(2),
];
export const shadows = defaultShadows;
