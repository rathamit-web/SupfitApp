import React, { Suspense, lazy } from 'react';
const Activity = lazy(() => import('lucide-react').then(m => ({ default: m.Activity })));
const Target = lazy(() => import('lucide-react').then(m => ({ default: m.Target })));
const Users = lazy(() => import('lucide-react').then(m => ({ default: m.Users })));
const Shield = lazy(() => import('lucide-react').then(m => ({ default: m.Shield })));
const Sparkles = lazy(() => import('lucide-react').then(m => ({ default: m.Sparkles })));
const UserCheck = lazy(() => import('lucide-react').then(m => ({ default: m.UserCheck })));
const ChevronRight = lazy(() => import('lucide-react').then(m => ({ default: m.ChevronRight })));
import type { LucideIcon } from 'lucide-react';
const SupfitLogo = lazy(() => import('@/assets/Supfitlogo.png').then(m => ({ default: m.default || m })));
// Auth page design tokens
const landingBg = 'linear-gradient(135deg, #e0e7ff 0%, #f5d0fe 100%)';
const glassCardStyle = {
  background: 'rgba(255,255,255,0.75)',
  borderRadius: '16px',
  boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
  border: '1px solid rgba(255,255,255,0.3)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  padding: '48px 32px 48px',
  maxWidth: 450,
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
import { useNavigate } from 'react-router-dom';
import { colors, typography, shadows, spacing, borderRadius, transitions } from '@/lib/designSystem';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <Suspense fallback={<div style={{ height: 48 }} />}> 
    <div
      className="group relative rounded-lg glass-card glass-card-hover hover-lift cursor-pointer"
      style={{
        padding: spacing[14],
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
      }}
    >
      <div className="relative z-10 flex flex-col items-center text-center" style={{ gap: spacing[10] }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            height: `${32}px`,
            width: `${32}px`,
            background: colors.primary,
            border: `1px solid ${colors.primary}`,
          }}
        >
          <Icon style={{ height: '16px', width: '16px', color: '#fff' }} />
        </div>
        <div>
          <h3 style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, lineHeight: '1.2' }}>
            {title}
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.xs,
              marginTop: spacing[4],
              color: colors.text.secondary,
              lineHeight: '1.4',
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  </Suspense>
);

type RoleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  role: 'individual' | 'coach';
};

const RoleCard = ({ icon: Icon, title, description, buttonText, role }: RoleCardProps) => {
  const navigate = useNavigate();
  const to = role === 'coach' ? '/auth?role=coach' : '/auth';
  return (
    <Suspense fallback={<button style={{ height: 80, width: '100%' }} disabled />}> 
      <button
        type="button"
        onClick={() => {
          localStorage.setItem('userRole', role === 'coach' ? 'coach' : 'individual');
          navigate(to);
        }}
        style={{
          width: '100%',
          height: '80px',
          background: colors.primary,
          border: `1.5px solid ${colors.primary}1a`,
          borderRadius: borderRadius.lg,
          boxShadow: shadows.sm,
          cursor: 'pointer',
          marginBottom: spacing[12],
          display: 'flex',
          alignItems: 'center',
          gap: spacing[18],
          padding: `${spacing[20]} ${spacing[18]}`,
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = shadows.md;
          (e.currentTarget.style as CSSStyleDeclaration).borderColor = `${colors.primary}2d`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = shadows.sm;
          (e.currentTarget.style as any).borderColor = `${colors.primary}1a`;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div
          style={{
            minWidth: '40px',
            minHeight: '40px',
            borderRadius: borderRadius.md,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 20,
              color: '#ffffff',
              fontFamily: typography.fontFamily.system,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: '#ffffff',
              marginTop: spacing[2],
              fontFamily: typography.fontFamily.system,
            }}
          >
            {role === 'individual'
              ? 'AI-powered fitness tracking'
              : 'Grow your fitness business with Supfit'}
          </div>
        </div>
        <ChevronRight style={{ width: '24px', height: '24px', color: '#ffffff', flexShrink: 0 }} />
      </button>
    </Suspense>
  );
};

export default function Landing() {
  const features = [
    {
      icon: Activity,
      title: 'AI-Powered Dashboard',
      description: 'Real-time vitals tracking with AI algorithms.',
    },
    {
      icon: Target,
      title: 'Personalized Plans',
      description: 'Custom workout and diet plans for you.',
    },
    {
      icon: Users,
      title: 'For Coaches',
      description: 'Manage clients and grow your business.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Enterprise-grade data security.',
    },
  ];

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          minHeight: '100vh',
          fontFamily: 'SF Pro Display, SF Pro Text, Roboto, Arial, sans-serif',
          background: landingBg,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={glassCardStyle}>
          {/* Logo centered at top */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 0, marginTop: 0 }}>
            <Suspense fallback={<div style={{ height: 80 }} />}> 
              <img
                src={require('@/assets/Supfitlogo.png')}
                alt="SupFit"
                style={{
                  width: '150px',
                  maxWidth: '60vw',
                  height: 'auto',
                  background: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                  filter: 'drop-shadow(0 2px 12px #ff3c2066)',
                  margin: 0,
                  verticalAlign: 'middle',
                  display: 'block',
                }}
              />
            </Suspense>
          </div>
        {/* Title & Subtitle */}
        <div className="text-center" style={{ marginBottom: 0, marginTop: 12 }}>
          <h1
            style={{
              fontWeight: 700,
              fontSize: 40,
              marginBottom: 12,
              color: '#1d1d1f',
              letterSpacing: '-0.6px',
              lineHeight: 1.1,
            }}
          >
            <div
              className="flex items-center justify-center gap-2"
              style={{ color: '#FF3C20', marginBottom: 18 }}
            >
              <Sparkles style={{ height: '16px', width: '16px', color: '#FF3C20' }} />
              <span style={{ fontSize: 15, fontWeight: 500 }}> Fuel your fitness, powered by AI </span>
              <Sparkles style={{ height: '16px', width: '16px', color: '#FF3C20' }} />
            </div>
          </h1>
        </div>
        {/* Role selection - centered vertically */}
        <div className="w-full flex justify-center px-3" style={{ alignItems: 'flex-start', display: 'flex', marginTop: 0, marginBottom: 0 }}>
          <div className="section-panel w-full max-w-6xl" style={{ padding: '18px 24px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: 0 }}>
            <h2
              style={{
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              Choose Your Role
            </h2>
            <div className="flex flex-col items-center" style={{ gap: 10 }}>
              <div className="w-full max-w-xl">
                <RoleCard
                  icon={Target}
                  title="Individual User"
                  description=""
                  buttonText="Continue as Individual"
                  role="individual"
                />
              </div>
              <div className="w-full max-w-xl">
                <RoleCard
                  icon={UserCheck}
                  title="Coach & Dietician"
                  description=""
                  buttonText="Continue as Coach"
                  role="coach"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features - moved below role selection */}
        <div
          className="grid grid-cols-2 w-[95%] max-w-3xl"
          style={{ gap: 24, margin: '24px auto 24px', justifyContent: 'center' }}
        >
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
        <p
          style={{
            textAlign: 'center',
            color: '#6e6e73',
            fontSize: 13,
            marginTop: 24,
          }}
        >
          © 2024 SupFit. Your journey to better health starts here.
        </p>
      </div>
    </div>
  );
}
