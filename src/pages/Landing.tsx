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

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div
    className="group relative rounded-lg glass-card glass-card-hover hover-lift cursor-pointer"
    style={{ padding: '14px' }}
  >
    <div className="relative z-10 flex flex-col items-center text-center" style={{ gap: '10px' }}>
      <div
        className="flex items-center justify-center rounded-full bg-[#FF3C20]/10 border border-[#FF3C20]/20"
        style={{ height: '32px', width: '32px' }}
      >
        <Icon className="text-[#FF3C20]" style={{ height: '16px', width: '16px' }} />
      </div>
      <div>
        <h3 className="font-semibold leading-tight" style={{ fontSize: '14px' }}>
          {title}
        </h3>
        <p
          className="text-muted-foreground leading-snug"
          style={{ fontSize: '13px', marginTop: '4px' }}
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
      onClick={() => navigate(to)}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.85))',
          boxShadow: '0 8px 32px rgba(255,60,32,0.08)',
          border: '1.5px solid rgba(255,60,32,0.10)',
          padding: '20px 18px',
          transition: 'box-shadow 0.2s, border 0.2s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(255,60,32,0.13)';
          e.currentTarget.style.border = '1.5px solid rgba(255,60,32,0.18)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,60,32,0.08)';
          e.currentTarget.style.border = '1.5px solid rgba(255,60,32,0.10)';
        }}
      >
        <div
          style={{
            minWidth: '48px',
            minHeight: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon style={{ width: '28px', height: '28px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '20px',
              color: '#222',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '15px',
              color: '#6e6e73',
              marginTop: '2px',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
            }}
          >
            {role === 'individual'
              ? 'AI-powered fitness tracking'
              : 'Grow your fitness business with Supfit'}
          </div>
        </div>
        <ChevronRight style={{ width: '24px', height: '24px', color: '#ff3c20' }} />
      </div>
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
    <div className="min-h-screen" style={{ backgroundColor: '#FDFDFD' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center px-3 py-4">
        <div style={{ marginBottom: '16px' }}>
          <img
            src={supfitLogo}
            alt="SupFit"
            className="signup-logo"
            style={{ background: 'transparent' }}
          />
        </div>

        <div className="text-center" style={{ marginBottom: '20px' }}>
          <h1
            className="font-bold tracking-tight leading-tight"
            style={{ fontSize: '20px', marginBottom: '12px' }}
          >
            Your Personal Health AI Companion
          </h1>
          <div
            className="flex items-center justify-center gap-2"
            style={{ color: '#FF3C20', marginBottom: '16px' }}
          >
            <Sparkles style={{ height: '16px', width: '16px', color: '#FF3C20' }} />
            <span style={{ fontSize: '14px' }}>Powered by Advanced AI</span>
            <Sparkles style={{ height: '16px', width: '16px', color: '#FF3C20' }} />
          </div>
        </div>

        <div
          className="grid grid-cols-2 w-[95%] max-w-3xl"
          style={{ gap: '12px', marginBottom: '16px' }}
        >
          {features.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>

        {/* Trust/KPI strip intentionally omitted to match mockup exactly */}

        <div className="w-full flex justify-center px-3">
          <div className="section-panel w-full max-w-6xl" style={{ padding: '20px 24px' }}>
            <h2
              className="text-center font-semibold"
              style={{ fontSize: '15px', marginBottom: '16px' }}
            >
              Choose Your Role
            </h2>
            <div className="flex flex-col items-center" style={{ gap: '12px' }}>
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
          className="text-center text-muted-foreground"
          style={{ fontSize: '11px', marginTop: '16px' }}
        >
          © 2024 SupFit. Your journey to better health starts here.
        </p>
      </main>
    </div>
  );
}
