import { Home, LayoutDashboard, Users, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';

const navItems = [
  { icon: Home, path: '/coach-home', label: 'Home' },
  { icon: LayoutDashboard, path: '/revenue', label: 'Revenue' },
  { icon: Users, path: '/client/1', label: 'Clients' },
  { icon: Star, path: '/testimonials', label: 'Testimonials' },
];

const CoachFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.95)',
        borderTop: '1px solid #eee',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
        padding: '0',
      }}
    >
      <nav style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '65px',
        maxWidth: 600,
        margin: '0 auto',
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.startsWith('/client') && location.pathname.startsWith('/client'));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
                minHeight: 0,
                padding: 0,
                width: 56,
                height: 56,
                borderRadius: 16,
                position: 'relative',
                transition: 'background 0.2s',
                color: isActive ? '#ff3c20' : '#1d1d1f',
              }}
            >
              <item.icon
                style={{
                  width: 28,
                  height: 28,
                  strokeWidth: 2.2,
                  color: isActive ? '#ff3c20' : '#1d1d1f',
                  transition: 'color 0.2s',
                  marginBottom: 2,
                  background: isActive ? 'rgba(255,60,32,0.08)' : 'none',
                  borderRadius: 8,
                  padding: 4,
                }}
              />
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 3,
                    borderRadius: 2,
                    background: '#ff3c20',
                  }}
                />
              )}
              <span style={{ fontSize: 11, marginTop: 2, color: isActive ? '#ff3c20' : '#6e6e73', fontWeight: 500 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};

export default CoachFooter;