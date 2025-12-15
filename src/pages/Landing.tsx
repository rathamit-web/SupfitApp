import {
  Activity,
  Target,
  Users,
  Shield,
  Sparkles,
  UserCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import supfitLogo from '@/assets/supfit-logo.png';
import { useNavigate } from 'react-router-dom';
import { colors, typography, shadows, spacing, borderRadius, transitions } from '@/lib/designSystem';

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
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
          background: `${colors.primary}20`,
          border: `1px solid ${colors.primary}33`,
        }}
      >
        <Icon className="text-[#FF3C20]" style={{ height: '16px', width: '16px', color: colors.primary }} />
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
    <button
      type="button"
      onClick={() => {
        localStorage.setItem('userRole', role === 'coach' ? 'coach' : 'individual');
        navigate(to);
      }}
      style={{
        width: '100%',
        background: `linear-gradient(135deg, ${colors.background.light}, rgba(255,255,255,0.85))`,
        border: `1.5px solid ${colors.primary}1a`,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        marginBottom: spacing[12],
        display: 'flex',
        alignItems: 'center',
        gap: spacing[18],
        padding: `${spacing[20]} ${spacing[18]}`,
        transition: transitions.normal,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.md;
        (e.currentTarget.style as CSSStyleDeclaration).borderColor = `${colors.primary}2d`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.sm;
        (e.currentTarget.style as any).borderColor = `${colors.primary}1a`;
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
            fontWeight: typography.fontWeight.bold,
            fontSize: typography.fontSize['2xl'],
            color: colors.text.primary,
            fontFamily: typography.fontFamily.system,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            marginTop: spacing[2],
            fontFamily: typography.fontFamily.system,
          }}
        >
          {role === 'individual'
            ? 'AI-powered fitness tracking'
            : 'Grow your fitness business with Supfit'}
        </div>
      </div>
      <ChevronRight style={{ width: '24px', height: '24px', color: colors.primary, flexShrink: 0 }} />
    </button>
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
    <div className="min-h-screen" style={{ backgroundColor: colors.background.light }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-3 py-4">
        <div style={{ marginBottom: spacing[16] }}>
          <img
            src={supfitLogo}
            alt="SupFit"
            className="signup-logo"
            style={{ background: 'transparent' }}
          />
        </div>

        <div className="text-center" style={{ marginBottom: spacing[20] }}>
          <h1
            style={{
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize['2xl'],
              marginBottom: spacing[12],
              color: colors.text.primary,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            Your Personal Health AI Companion
          </h1>
          <div
            className="flex items-center justify-center gap-2"
            style={{ color: colors.primary, marginBottom: spacing[16] }}
          >
            <Sparkles style={{ height: '16px', width: '16px', color: colors.primary }} />
            <span style={{ fontSize: typography.fontSize.sm }}>{' '}
              Powered by Advanced AI
            </span>
            <Sparkles style={{ height: '16px', width: '16px', color: colors.primary }} />
          </div>
        </div>

        <div
          className="grid grid-cols-2 w-[95%] max-w-3xl"
          style={{ gap: spacing[12], marginBottom: spacing[16] }}
        >
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>

        {/* Trust/KPI strip intentionally omitted to match mockup exactly */}

        <div className="w-full flex justify-center px-3">
          <div className="section-panel w-full max-w-6xl" style={{ padding: `${spacing[20]} ${spacing[24]}` }}>
            <h2
              style={{
                textAlign: 'center',
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.base,
                marginBottom: spacing[16],
              }}
            >
              Choose Your Role
            </h2>
            <div className="flex flex-col items-center" style={{ gap: spacing[12] }}>
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

        <p
          style={{
            textAlign: 'center',
            color: colors.text.secondary,
            fontSize: typography.fontSize.xs,
            marginTop: spacing[16],
          }}
        >
          © 2024 SupFit. Your journey to better health starts here.
        </p>
      </main>
    </div>
  );
}
