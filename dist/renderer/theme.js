import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#00ff88' },
        secondary: { main: '#ff4444' },
        background: {
            default: '#1a1a2e',
            paper: '#1e1e3a',
        },
        text: {
            primary: '#e0e0e0',
            secondary: '#888',
        },
    },
    typography: {
        fontFamily: '"Segoe UI", "Roboto", "Oxygen", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 'bold' },
            },
        },
        MuiTextField: {
            defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0d0d1a',
                    },
                },
            },
        },
    },
});
