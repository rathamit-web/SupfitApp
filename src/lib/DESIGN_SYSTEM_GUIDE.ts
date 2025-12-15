/**
 * DESIGN SYSTEM USAGE GUIDE
 * ========================
 * 
 * This guide shows how to use the centralized design system tokens
 * across all pages in the Supfit application.
 */

// ============================================================================
// EXAMPLE 1: Basic Page Setup with Hero Layout
// ============================================================================
/*
import { colors, typography, layouts, shadows } from '@/lib/designSystem';

export const MyPage = () => {
  return (
    <main style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.background.subtle} 0%, ${colors.background.muted} 100%)`,
      fontFamily: typography.fontFamily.system,
      paddingBottom: '80px',
      letterSpacing: typography.letterSpacing.tighter,
    }}>
      <header style={layouts.header}>
        {/* Page content */}
      </header>
    </main>
  );
};
*/

// ============================================================================
// EXAMPLE 2: Creating Cards with Consistent Styling
// ============================================================================
/*
import { components, shadows, borderRadius, spacing } from '@/lib/designSystem';

<div style={{
  ...components.card,
  padding: spacing[24],
}}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = shadows.xl;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = shadows.lg;
  }}
>
  Card content here
</div>
*/

// ============================================================================
// EXAMPLE 3: Buttons - Primary, Secondary, Ghost
// ============================================================================
/*
import { components } from '@/lib/designSystem';

// Primary Button (CTA)
<button style={components.button.primary}>
  Click Me
</button>

// Secondary Button
<button style={components.button.secondary}>
  Learn More
</button>

// Ghost Button (Text-based)
<button style={components.button.ghost}>
  Skip
</button>
*/

// ============================================================================
// EXAMPLE 4: Typography Hierarchy
// ============================================================================
/*
import { colors, typography } from '@/lib/designSystem';

// Large Heading (H1)
<h1 style={{
  fontSize: typography.fontSize['8xl'],
  fontWeight: typography.fontWeight.extrabold,
  letterSpacing: typography.letterSpacing.tight,
  color: colors.text.primary,
}}>
  Main Title
</h1>

// Subheading (H2)
<h2 style={{
  fontSize: typography.fontSize['4xl'],
  fontWeight: typography.fontWeight.bold,
  letterSpacing: typography.letterSpacing.tighter,
  color: colors.text.primary,
}}>
  Section Heading
</h2>

// Body Text
<p style={{
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.normal,
  lineHeight: typography.lineHeight.relaxed,
  color: colors.text.secondary,
}}>
  Body text content
</p>

// Small Text
<span style={{
  fontSize: typography.fontSize.sm,
  fontWeight: typography.fontWeight.normal,
  color: colors.text.tertiary,
}}>
  Helper text
</span>
*/

// ============================================================================
// EXAMPLE 5: Stat Cards (like in Index.tsx)
// ============================================================================
/*
import { components, colors, spacing, typography } from '@/lib/designSystem';

{stats.map((stat) => {
  const Icon = stat.icon;
  return (
    <div
      key={stat.label}
      style={{
        ...components.statCard,
        ...{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing[10],
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = shadows.xl;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = shadows.lg;
      }}
    >
      <div style={{
        padding: spacing[12],
        borderRadius: borderRadius.lg,
        background: `linear-gradient(135deg, rgba(255, 60, 32, 0.12), rgba(255, 60, 32, 0.06))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon style={{ 
          width: '24px', 
          height: '24px', 
          color: colors.primary, 
          strokeWidth: 2.5 
        }} />
      </div>
      <p style={{
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: typography.letterSpacing.tight,
        margin: 0,
      }}>
        {stat.value}
      </p>
      <p style={{
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        fontWeight: typography.fontWeight.semibold,
        margin: 0,
      }}>
        {stat.label}
      </p>
    </div>
  );
})}
*/

// ============================================================================
// EXAMPLE 6: Using Gradients
// ============================================================================
/*
import { colors, typography } from '@/lib/designSystem';

<h1 style={{
  fontSize: typography.fontSize['7xl'],
  fontWeight: typography.fontWeight.extrabold,
  background: colors.gradients.primary,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>
  Gradient Text
</h1>

<button style={{
  background: colors.gradients.accent,
  color: '#fff',
  padding: spacing[12],
  borderRadius: borderRadius.md,
  fontWeight: typography.fontWeight.bold,
  border: 'none',
  cursor: 'pointer',
}}>
  Gradient Button
</button>
*/

// ============================================================================
// EXAMPLE 7: Badges
// ============================================================================
/*
import { components } from '@/lib/designSystem';

// Primary Badge
<span style={components.badge.primary}>
  Active
</span>

// Secondary Badge
<span style={components.badge.secondary}>
  Pending
</span>
*/

// ============================================================================
// EXAMPLE 8: Glass Morphism Effect
// ============================================================================
/*
import { backdrop, borderRadius, spacing } from '@/lib/designSystem';

<div style={{
  ...backdrop.effect.light,
  borderRadius: borderRadius.xl,
  padding: spacing[24],
}}>
  Glass effect content
</div>
*/

// ============================================================================
// EXAMPLE 9: Logo Implementation
// ============================================================================
/*
import { logo } from '@/lib/designSystem';

<img 
  src={supfitLogo}
  alt="Supfit"
  style={{
    width: logo.sizes.lg,  // or 'md', 'sm', etc.
    color: logo.color,
    maxWidth: logo.maxWidth.md,
  }}
/>
*/

// ============================================================================
// EXAMPLE 10: Responsive Design with Breakpoints
// ============================================================================
/*
import { breakpoints, spacing, typography } from '@/lib/designSystem';

// Use with media queries (inline styles in this example, 
// but recommended to use CSS or Tailwind for responsive design)

const ResponsiveComponent = () => {
  const isMobile = window.innerWidth < parseInt(breakpoints.md);
  
  return (
    <div style={{
      padding: isMobile ? spacing[16] : spacing[24],
      fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
    }}>
      Responsive content
    </div>
  );
};
*/

// ============================================================================
// QUICK REFERENCE
// ============================================================================
/*
COLORS:
  colors.primary = #FF3C20 (main brand color)
  colors.text.primary = #1d1d1f (main text)
  colors.background.subtle = #f8f9fa (light background)
  
TYPOGRAPHY:
  typography.fontSize.base = 15px
  typography.fontWeight.bold = 700
  
SPACING:
  spacing[8] = 8px
  spacing[16] = 16px
  spacing[24] = 24px
  
SHADOWS:
  shadows.lg = 0 8px 32px rgba(0, 0, 0, 0.08)...
  shadows.xl = 0 12px 48px rgba(0, 0, 0, 0.12)...
  
BORDER RADIUS:
  borderRadius.md = 12px
  borderRadius.lg = 16px
  borderRadius.xl = 18px

COMPONENTS:
  components.card = Pre-styled card container
  components.button.primary = Primary button style
  components.statCard = Stat card styling

TRANSITIONS:
  transitions.normal = 'all 0.3s cubic-bezier(...)'
  transitions.fast = 'all 0.2s ease'
*/

// ============================================================================
// MIGRATION CHECKLIST FOR EXISTING PAGES
// ============================================================================
/*
1. Import design system at the top of each page:
   import { colors, typography, shadows, spacing, ... } from '@/lib/designSystem';

2. Replace hardcoded color values:
   OLD: color: '#FF3C20'
   NEW: color: colors.primary

3. Replace font values:
   OLD: fontSize: '28px'
   NEW: fontSize: typography.fontSize['4xl']

4. Apply card styles:
   OLD: background: 'rgba(...)', border: '1px solid...'
   NEW: ...components.card

5. Use spacing tokens:
   OLD: padding: '20px'
   NEW: padding: spacing[20]

6. Apply shadows consistently:
   OLD: boxShadow: '0 4px 16px...'
   NEW: boxShadow: shadows.lg

7. Use transitions:
   OLD: transition: 'all 0.3s'
   NEW: transition: transitions.normal

8. Test across pages to ensure consistency
*/

export default {};
