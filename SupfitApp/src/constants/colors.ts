/**
 * SupfitApp Brand Colors
 * Centralized color definitions for consistent branding across the app
 * Last Updated: February 8, 2026
 */

export const SUPFIT_BRAND_COLORS = {
  /**
   * PRIMARY BRAND COLOR - SupfitApp Logo Orange
   * Used for: Buttons, icons, highlights, badges, accent text
   * Reference: SupfitApp logo color (vibrant orange-red)
   */
  PRIMARY: '#ff3c20',
  
  // Derived variations
  PRIMARY_LIGHT: 'rgba(255, 60, 32, 0.08)',
  PRIMARY_MEDIUM: 'rgba(255, 60, 32, 0.5)',
  PRIMARY_DARK: 'rgba(255, 60, 32, 0.2)',
  PRIMARY_GRADIENT_START: '#FF7A4D',
  PRIMARY_GRADIENT_END: '#ff3c20',

  // Secondary colors
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3C20',
  
  // Neutral colors
  NEUTRAL_DARK: '#1d1d1f',
  NEUTRAL_MEDIUM: '#6e6e73',
  NEUTRAL_LIGHT: '#86868b',
  NEUTRAL_LIGHTER: '#e5e5ea',
  NEUTRAL_LIGHTEST: '#f5f5f7',
  
  // Whites and blacks
  WHITE: '#ffffff',
  BLACK: '#000000',
  
  // Transparent variants
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.3)',
  OVERLAY_MEDIUM: 'rgba(0, 0, 0, 0.5)',
};

/**
 * Deprecated color variables (for backwards compatibility)
 * These are replaced by SUPFIT_BRAND_COLORS.PRIMARY
 * @deprecated Use SUPFIT_BRAND_COLORS.PRIMARY instead
 */
export const LEGACY_BRAND_COLOR = '#ff3c20';

/**
 * Quick access to primary brand color
 */
export const PRIMARY_COLOR = SUPFIT_BRAND_COLORS.PRIMARY;

export default SUPFIT_BRAND_COLORS;
