// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#673ab7', // بنفسجي غامق
    },
    secondary: {
      main: '#ff4081', // وردي
    },
    background: {
      default: '#f5f5f5', // خلفية فاتحة
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
});

export default theme;