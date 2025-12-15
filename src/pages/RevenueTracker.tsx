import { useState } from 'react';

// Removed unused Card, CardContent import
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Users, User, MessageCircle } from 'lucide-react';
import RevenueTrackerIcon from '@/components/RevenueTrackerIcon';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
// Footer replaced with inline navigation below
import PageContainer from '@/components/PageContainer';
import { colors, typography, shadows, spacing, borderRadius, transitions } from '@/lib/designSystem';

const RevenueTracker = () => {
  // Toggle state: 'revenue' or 'clients'
  const [viewMode, setViewMode] = useState<'revenue' | 'clients'>('revenue');

  // Data for both modes
  const barData = [
    { month: 'Oct', revenue: 65000, clients: 41 },
    { month: 'Nov', revenue: 73000, clients: 45 },
    { month: 'Dec', revenue: 80000, clients: 48 },
  ];

  // Simulate fetching growth percentage from database (mocked)
  const growthPercent = 12; // Replace with real fetch logic when backend is ready
  const stats = [
    {
      label: 'Total Revenue',
      value: '₹67,322',
      change: '+32% this month',
      changeColor: 'text-green-500',
      icon: RevenueTrackerIcon,
    },
    {
      label: 'Active Clients',
      value: '48',
      change: '+17%',
      changeColor: 'text-green-500',
      icon: Users,
      newClients: 7, // Example value
      dropOffs: 2,   // Example value
    },
  ];

  // Top clients data
  const topClients = [
    {
      id: 2,
      name: 'Priya Sharma',
      revenue: '₹10,500',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 3,
      name: 'Rahul Verma',
      revenue: '₹8,200',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
  ];

  // Removed unused packagePopularity

  // Removed unused paymentMethods

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.background.subtle} 0%, ${colors.background.muted} 100%)`,
        fontFamily: typography.fontFamily.system,
        paddingBottom: spacing[40],
        letterSpacing: typography.letterSpacing.tighter,
      }}
    >
      <PageContainer>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: `0 ${spacing[24]}` }}>
          <h1
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.primary,
              marginBottom: spacing[24],
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            Revenue Tracker
          </h1>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[16], marginBottom: spacing[32] }}>
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              // Active Clients palette (second)
              if (idx === 1) {
                return (
                  <div
                    key={stat.label}
                    style={{
                      background: colors.glass.light,
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.lg,
                      padding: spacing[12], // reduced padding
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing[4], // reduced gap
                      alignItems: 'flex-start',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: transitions.normal,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                      <Icon style={{ width: 18, height: 18, color: colors.primary }} />
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>{stat.label}</span>
                    </div>
                    <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{stat.value}</span>
                    {stat.change && (() => {
                      let color = colors.text.secondary;
                      if (stat.changeColor === 'text-green-500') color = colors.success;
                      else if (stat.changeColor === 'text-red-500') color = colors.error;
                      return (
                        <span style={{ fontSize: typography.fontSize.xs, color }}>{stat.change}</span>
                      );
                    })()}
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.success, fontWeight: 500 }}>
                        +{stat.newClients} New this month
                      </span>
                      <br />
                      <span style={{ fontSize: typography.fontSize.xs, color: colors.error, fontWeight: 500 }}>
                        {stat.dropOffs} Drop-offs/Cancellations
                      </span>
                    </div>
                  </div>
                );
              }
              // Total Session Booking palette (third)
              // (Removed: No stat at idx 2, and no popularSlots property)
              // Default palette
              return (
                <div
                  key={stat.label}
                  style={{
                    background: colors.glass.light,
                    borderRadius: borderRadius.xl,
                    boxShadow: shadows.lg,
                    padding: spacing[24],
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[8],
                    alignItems: 'flex-start',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: transitions.normal,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
                    <Icon style={{ width: 22, height: 22, color: colors.primary }} />
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{stat.label}</span>
                  </div>
                  <span style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>{stat.value}</span>
                  {stat.change && (() => {
                    let color = colors.text.secondary;
                    if (stat.changeColor === 'text-green-500') color = colors.success;
                    else if (stat.changeColor === 'text-red-500') color = colors.error;
                    return (
                      <span style={{ fontSize: typography.fontSize.xs, color }}>{stat.change}</span>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* Revenue Chart & 3-Month Comparison */}
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: borderRadius['2xl'],
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              marginBottom: spacing[32],
              border: '1px solid rgba(0,0,0,0.06)',
              padding: spacing[32],
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Liquid Glass highlight */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              left: '-40px',
              width: '180px',
              height: '180px',
              background: 'linear-gradient(135deg, #fff 0%, #e0e7ef 100%)',
              opacity: 0.18,
              borderRadius: '50%',
              filter: 'blur(32px)',
              zIndex: 0,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[16] }}>
              <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}> 
                {viewMode === 'revenue' ? 'Revenue' : 'Active Clients'}
              </h2>
              <div style={{ display: 'flex', gap: 8, background: colors.glass.medium, borderRadius: borderRadius.md, padding: '4px', border: '1px solid #eee' }}>
                <button
                  onClick={() => setViewMode('revenue')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: borderRadius.sm,
                    background: viewMode === 'revenue' ? colors.primary : 'transparent',
                    color: viewMode === 'revenue' ? '#fff' : colors.text.primary,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    transition: 'all 0.2s',
                  }}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setViewMode('clients')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: borderRadius.sm,
                    background: viewMode === 'clients' ? colors.primary : 'transparent',
                    color: viewMode === 'clients' ? '#fff' : colors.text.primary,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    transition: 'all 0.2s',
                  }}
                >
                  Active Clients
                </button>
              </div>
            </div>
            {/* 3-Month Bar Chart */}
            <div style={{ width: '100%', maxWidth: 340, margin: '0 auto', marginBottom: spacing[8], zIndex: 1, position: 'relative' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} barCategoryGap={40}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 16, fill: colors.text.secondary, fontWeight: 600 }} />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => viewMode === 'revenue' ? [`₹${value.toLocaleString()}`, 'Revenue'] : [value, 'Clients']}
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e0e7ef', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} 
                    itemStyle={{ color: colors.primary, fontWeight: 700 }} 
                  />
                  <Bar 
                    dataKey={viewMode === 'revenue' ? 'revenue' : 'clients'} 
                    radius={[12, 12, 0, 0]}
                    label={{
                      position: 'top',
                      formatter: (v: number) => viewMode === 'revenue' ? `₹${v.toLocaleString()}` : v,
                      fill: colors.text.primary,
                      fontWeight: typography.fontWeight.bold,
                      fontSize: 16,
                    }}
                    fill={colors.primary}
                    style={{ filter: 'drop-shadow(0 4px 16px rgba(122,193,66,0.12))' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Inference message below chart */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <span style={{
                display: 'inline-block',
                background: 'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)',
                color: colors.text.primary, // graphite
                fontWeight: 600,
                fontSize: typography.fontSize.base,
                borderRadius: 12,
                padding: '8px 20px',
                boxShadow: '0 2px 8px rgba(255,60,32,0.07)',
              }}>
                Great job! You grew {growthPercent}% this month!
              </span>
            </div>
          </div>

          {/* Top Clients */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16], marginBottom: spacing[32] }}>
            <div
              style={{
                background: colors.glass.light,
                borderRadius: borderRadius.xl,
                boxShadow: shadows.lg,
                border: '1px solid rgba(0,0,0,0.06)',
                padding: spacing[24],
              }}
            >
              <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[16] }}>Top Clients</h2>
              {topClients.map((client) => (
                <div
                  key={client.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12], marginBottom: spacing[12] }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
                    <Avatar style={{ width: '40px', height: '40px', background: colors.glass.medium }}>
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>{client.name[0]}</AvatarFallback>
                    </Avatar>
                    <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.text.primary }}>{client.name}</span>
                  </div>
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.primary }}>{client.revenue}</span>
                </div>
              ))}
            </div>
          </div>


          {/* Motivational Footer */}
          <div style={{ textAlign: 'center', padding: `${spacing[8]} 0 ${spacing[4]} 0` }}>
            <p style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
              Your effort = Your growth 🚀
            </p>
          </div>

        </div>
      </PageContainer>
      {/* Add bottom padding to prevent content overlap with fixed footer */}
      <div style={{ height: '65px' }} />
      {/* Inline Footer Navigation (coach version) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {[
          { icon: Home, path: '/coach-home' },
          { icon: 'revenue', path: '/revenue' },
          { icon: User, path: '/settings' },
          { icon: MessageCircle, path: '/testimonials' },
        ].map((item) => {
          const currentPath = globalThis.location.pathname;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { globalThis.location.href = item.path; }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isActive ? '#ff3c20' : '#1d1d1f',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(255, 60, 32, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon === 'revenue' ? (
                <RevenueTrackerIcon size={22} style={{ display: 'block' }} />
              ) : (
                <item.icon style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
              )}
            </button>
          );
        })}
      </div>
    </main>
    );
    };

    export default RevenueTracker;
