// src/styles/theme.ts
// Centralized design tokens for Supfit

export const supfitTheme = {
  background: 'linear-gradient(135deg, #e0e7ff 0%, #f5d0fe 100%)',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Roboto", "Google Sans", "Helvetica Neue", Arial, sans-serif',
  fontColor: '#1d1d1f',
  accent: '#ff3c20',
  accentLight: 'rgba(255, 60, 32, 0.08)',
  accentDisabled: 'rgba(255, 60, 32, 0.5)',
  button: {
    background: '#ff3c20',
    color: '#fff',
    borderRadius: '16px',
    fontWeight: 800,
    fontSize: '17px',
    height: '56px',
    boxShadow: '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8',
    transition: 'background 0.2s',
    disabledBg: 'rgba(255, 60, 32, 0.5)',
    disabledColor: '#fff',
  },
};
