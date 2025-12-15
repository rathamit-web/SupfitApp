/**
 * Supfit Design System
 * Implements Apple iOS HIG & Google Material Design 3 principles
 * Provides centralized design tokens for consistent styling across all pages
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================
export const colors = {
  // Primary Brand Colors
  primary: '#FF3C20', // Supfit orange
  primaryDark: '#e13a00',
  primaryLight: '#ff5722',
  
  // Neutral Colors (Apple-style)
  text: {
    primary: '#1d1d1f',
    secondary: '#6e6e73',
    tertiary: '#888888',
    disabled: '#a1a1a6',
  },
  
  // Background Colors
  background: {
    light: '#ffffff',
    subtle: '#f8f9fa',
    muted: '#f5f5f7',
    dark: '#f0f0f2',
  },
  
  // Functional Colors
  success: '#34c759',
  warning: '#ff9500',
  error: '#f44336',
  info: '#2196f3',
  
  // Glass Morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(255, 255, 255, 0.72)',
    dark: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #1d1d1f 0%, #ff3c20 100%)',
    accent: 'linear-gradient(90deg, #ff3c20 0%, #ff5722 100%)',
    warm: 'linear-gradient(135deg, #fb923c, #fbbf24)',
    cool: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
    success: 'linear-gradient(135deg, #4ade80, #34d399)',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================
export const typography = {
  fontFamily: {
    system: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Roboto", "Google Sans", "Helvetica Neue", Arial, sans-serif',
  },
  
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
    '6xl': '36px',
    '7xl': '40px',
    '8xl': '48px',
    '9xl': '52px',
  },
  
  fontWeight: {
    light: 400,
    normal: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.6,
  },
  
  letterSpacing: {
    tight: '-0.5px',
    tighter: '-0.24px',
    default: '0px',
    wide: '0.2px',
  },
};

// ============================================================================
// SHADOWS (Apple-style depth)
// ============================================================================
export const shadows = {
  none: 'none',
  xs: '0 2px 8px rgba(0, 0, 0, 0.04)',
  sm: '0 4px 12px rgba(0, 0, 0, 0.08)',
  md: '0 8px 16px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)',
  xl: '0 12px 48px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.04)',
  '2xl': '0 20px 60px rgba(0, 0, 0, 0.15)',
  
  // Brand-specific shadows
  brandSm: '0 2px 8px rgba(255, 60, 32, 0.12)',
  brandMd: '0 4px 24px rgba(255, 60, 32, 0.18)',
  brandLg: '0 8px 32px rgba(255, 60, 32, 0.15)',
};

// ============================================================================
// SPACING
// ============================================================================
export const spacing = {
  0: '0px',
  2: '2px',
  4: '4px',
  6: '6px',
  8: '8px',
  12: '12px',
  16: '16px',
  20: '20px',
  24: '24px',
  32: '32px',
  40: '40px',
  48: '48px',
  64: '64px',
};

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '22px',
  full: '9999px',
};

// ============================================================================
// BACKDROP & GLASS EFFECTS
// ============================================================================
export const backdrop = {
  blur: {
    sm: 'blur(12px)',
    md: 'blur(16px)',
    lg: 'blur(24px)',
    xl: 'blur(32px)',
  },
  effect: {
    light: {
      background: colors.glass.light,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
    },
    medium: {
      background: colors.glass.medium,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
    },
    dark: {
      background: colors.glass.dark,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
    },
  },
};

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================
export const transitions = {
  fast: 'all 0.2s ease',
  normal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================
export const components = {
  // Card/Container base style
  card: {
    background: colors.glass.light,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: borderRadius.xl,
    boxShadow: shadows.lg,
    transition: transitions.normal,
  },
  
  // Button styles
  button: {
    primary: {
      background: colors.primary,
      color: colors.background.light,
      fontWeight: typography.fontWeight.bold,
      borderRadius: borderRadius.md,
      padding: `${spacing[12]} ${spacing[24]}`,
      boxShadow: shadows.brandMd,
      transition: transitions.fast,
      border: 'none',
      cursor: 'pointer',
    },
    secondary: {
      background: colors.glass.light,
      color: colors.text.primary,
      fontWeight: typography.fontWeight.semibold,
      borderRadius: borderRadius.md,
      padding: `${spacing[8]} ${spacing[18]}`,
      border: `1px solid ${colors.background.dark}`,
      transition: transitions.fast,
      cursor: 'pointer',
    },
    ghost: {
      background: 'transparent',
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
      border: 'none',
      padding: `${spacing[8]} ${spacing[16]}`,
      cursor: 'pointer',
    },
  },
  
  // Stat card style
  statCard: {
    background: colors.glass.light,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: borderRadius.xl,
    padding: spacing[24],
    boxShadow: shadows.lg,
    transition: transitions.normal,
    cursor: 'pointer',
  },
  
  // Badge style
  badge: {
    primary: {
      background: colors.primary,
      color: colors.background.light,
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.sm,
      padding: `${spacing[8]} ${spacing[16]}`,
      borderRadius: borderRadius.md,
    },
    secondary: {
      background: `${colors.primary}20`,
      color: colors.primary,
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.sm,
      padding: `${spacing[8]} ${spacing[16]}`,
      borderRadius: borderRadius.md,
    },
  },
};

// ============================================================================
// PAGE LAYOUTS
// ============================================================================
export const layouts = {
  mainContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `${spacing[24]} ${spacing[20]}`,
  },
  
  header: {
    padding: `${spacing[40]} ${spacing[20]} ${spacing[24]}`,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  
  hero: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.background.subtle} 0%, ${colors.background.muted} 100%)`,
    paddingBottom: spacing[80],
  },
};

// ============================================================================
// LOGO STANDARDIZATION
// ============================================================================
export const logo = {
  sizes: {
    xs: '24px',
    sm: '32px',
    md: '48px',
    lg: '64px',
    xl: '96px',
    '2xl': '128px',
  },
  
  color: colors.primary,
  
  maxWidth: {
    sm: '200px',
    md: '280px',
    lg: '350px',
  },
};

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  notification: 1070,
};

// ============================================================================
// UTILITY FUNCTION: Apply card hover effect
// ============================================================================
export const applyCardHoverEffect = (element: HTMLElement) => {
  element.style.transform = 'translateY(-4px)';
  element.style.boxShadow = shadows.xl;
};

export const removeCardHoverEffect = (element: HTMLElement) => {
  element.style.transform = 'translateY(0)';
  element.style.boxShadow = shadows.lg;
};
