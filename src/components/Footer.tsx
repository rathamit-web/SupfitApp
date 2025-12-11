import { Home, Calendar, LayoutDashboard, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom Revenue Icon with green bars and white arrow
const RevenueIcon = ({ isActive }: { isActive: boolean }) => (
  <div
    className={`relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-200/80 to-blue-300/60 backdrop-blur-md shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/40 flex items-end justify-center p-1.5 gap-0.5 transition-all duration-300 ${isActive ? 'scale-110 shadow-[0_4px_12px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.8)]' : ''}`}
  >
    {/* Green bars */}
    <div className="w-1.5 h-2 bg-green-500 rounded-sm" />
    <div className="w-1.5 h-3 bg-green-500 rounded-sm" />
    <div className="w-1.5 h-4 bg-green-500 rounded-sm" />
    {/* White arrow/trend line */}
    <svg className="absolute top-1 left-1 w-6 h-4" viewBox="0 0 24 16" fill="none">
      <path
        d="M2 14 L8 10 L12 12 L22 2"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 2 L22 2 L22 6"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  </div>
);

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on coach pages
  const isCoachPage =
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/client') ||
    location.pathname === '/revenue';

  const userNavItems = [
    { icon: Home, path: '/', isCustom: false },
    { icon: Calendar, path: '/plan', isCustom: false },
    { icon: LayoutDashboard, path: '/dashboard', isCustom: false },
    { icon: User, path: '/settings', isCustom: false },
  ];

  const coachNavItems = [
    { icon: Home, path: '/coach', isCustom: false },
    { icon: null, path: '/revenue', isCustom: true },
    { icon: Calendar, path: '/plan', isCustom: false },
    { icon: User, path: '/settings', isCustom: false },
  ];

  const navItems = isCoachPage ? coachNavItems : userNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4 rounded-[28px] px-4 py-3 bg-white/40 dark:bg-black/30 backdrop-blur-2xl border border-white/50 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-around max-w-xs mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.isCustom) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative p-1.5 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white/60 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]'
                      : 'hover:bg-white/30 dark:hover:bg-white/10'
                  }`}
                >
                  <RevenueIcon isActive={isActive} />
                </button>
              );
            }

            const Icon = item.icon!;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/60 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'hover:bg-white/30 dark:hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive ? 'text-primary scale-110' : 'text-muted-foreground/70'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Footer;
