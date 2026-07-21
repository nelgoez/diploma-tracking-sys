import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4B9CD3',
      light: '#7BBDE3',
      dark: '#2B6DAE',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D4A843',
      light: '#E2C47A',
      dark: '#B8892E',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2E7D5B',
      light: '#4A9E7A',
      dark: '#1E5D42',
      contrastText: '#ffffff',
    },
    error: {
      main: '#C8434A',
      light: '#DD6B71',
      dark: '#A52E35',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#E87A6A',
      light: '#F0A094',
      dark: '#D05A48',
      contrastText: '#ffffff',
    },
    info: {
      main: '#7BA384',
      light: '#9DC0A4',
      dark: '#5D8466',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F3F0',
      paper: '#FAFAF8',
    },
    text: {
      primary: '#1C1B1A',
      secondary: '#5C5B5A',
      disabled: '#B0AEAC',
    },
    divider: '#E0DDDA',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          'borderRadius': 8,
          'textTransform': 'none',
          'fontWeight': 600,
          '&:active': {
            transform: 'scale(0.97)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&:active': {
              transform: 'none',
            },
          },
        },
        containedPrimary: ({ theme }) => ({
          'backgroundColor': theme.palette.primary.dark,
          '&:hover': {
            backgroundColor: '#1E5F9A',
          },
        }),
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '1rem',
        },
        sizeMedium: {
          padding: '8px 20px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        },
        elevation3: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          'boxShadow': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          'transition': 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '&:hover': {
              transform: 'none',
            },
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E0DDDA',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E0DDDA',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#E0DDDA',
        },
        head: {
          fontWeight: 600,
          color: '#5C5B5A',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardSuccess: {
          backgroundColor: '#E8F5EE',
          color: '#1E5D42',
        },
        standardError: {
          backgroundColor: '#FDE8EA',
          color: '#A52E35',
        },
        standardWarning: {
          backgroundColor: '#FDECEA',
          color: '#D05A48',
        },
        standardInfo: {
          backgroundColor: '#EDF5EF',
          color: '#5D8466',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 26,
          padding: 0,
        },
        switchBase: {
          'padding': 3,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
          },
        },
        thumb: {
          width: 20,
          height: 20,
        },
        track: {
          borderRadius: 13,
        },
      },
    },
  },
});
