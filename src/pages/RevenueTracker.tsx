import { useState } from 'react';

// Removed unused Card, CardContent import
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import CoachFooter from '@/components/CoachFooter';
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
      value: '₹6,222',
      change: '+2% this month',
      changeColor: 'green',
      icon: RevenueTrackerIcon,
    },
    {
      label: 'Active Clients',
      value: '48',
      newClients: 7,
      dropOffs: 2,
      icon: Users,
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

          {/* Screenshot-matching Stat Palettes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: spacing[24] }}>
            {/* Total Revenue Card - compact */}
            <div style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(255,60,32,0.07)', minHeight: 78 }}>
              <div style={{ background: colors.primary, width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{
                  fontFamily: 'SF Pro Display, Inter, Roboto, Arial, sans-serif',
                  fontWeight: 900,
                  fontSize: 32,
                  color: '#fff',
                  letterSpacing: '-1px',
                  display: 'inline-block',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  marginTop: 2
                }}>₹</span>
              </div>
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 1 }}>Total Revenue</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#222', marginBottom: 6 }}>{stats[0].value}</span>
                <span style={{
                  fontSize: 13,
                  color: '#23a94d',
                  background: 'rgba(35,169,77,0.12)',
                  borderRadius: 8,
                  padding: '2px 10px',
                  fontWeight: 600,
                  display: 'inline-block',
                  width: 'fit-content',
                }}>{stats[0].change}</span>
              </div>
            </div>
            {/* Active Clients Card - compact */}
            <div style={{ display: 'flex', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(255,60,32,0.07)', minHeight: 78 }}>
              <div style={{ background: colors.primary, width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Users style={{ width: 32, height: 32, color: '#fff' }} />
                <div style={{ position: 'absolute', right: 10, top: 20, width: 10, height: 10, background: '#23a94d', borderRadius: '50%', border: '1.5px solid #fff' }} />
              </div>
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#222', marginBottom: 1 }}>Active Clients</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#222', marginBottom: 0 }}>{stats[1].value}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#23a94d', marginLeft: 8 }}>+{stats[1].newClients} new</span>
                </span>
                <span style={{
                  fontSize: 13,
                  color: '#fff',
                  background: colors.primary,
                  borderRadius: 8,
                  padding: '2px 10px',
                  fontWeight: 600,
                  display: 'inline-block',
                  width: 'fit-content',
                  marginTop: 4,
                }}>+{stats[1].dropOffs} drop-offs</span>
              </div>
            </div>
          </div>

          {/* Apple-style Glassmorphic Toggle Chart Card */}
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 12px rgba(255,60,32,0.07)', padding: '32px 32px 24px 32px', marginBottom: spacing[32], maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            {/* Apple Glass Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.28)',
                  borderRadius: 32,
                  boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(18px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                  border: `1.5px solid rgba(255,255,255,0.45)`,
                  padding: 4,
                  position: 'relative',
                  minWidth: 180,
                  minHeight: 48,
                  width: 220,
                  transition: 'background 0.3s',
                }}
              >
                {/* Sliding pill */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: viewMode === 'revenue' ? 4 : 110,
                    width: 106,
                    height: 40,
                    borderRadius: 28,
                    background: colors.primary,
                    boxShadow: `0 2px 8px 0 ${colors.primary}22`,
                    transition: 'left 0.25s cubic-bezier(.4,2,.6,1)',
                    zIndex: 1,
                    border: `1.5px solid ${colors.primary}`,
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  }}
                />
                {/* Revenue Button */}
                <button
                  onClick={() => setViewMode('revenue')}
                  style={{
                    zIndex: 2,
                    width: 106,
                    height: 40,
                    border: 'none',
                    outline: 'none',
                    background: 'none',
                    color: viewMode === 'revenue' ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 28,
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  Revenue
                </button>
                {/* Clients Button */}
                <button
                  onClick={() => setViewMode('clients')}
                  style={{
                    zIndex: 2,
                    width: 106,
                    height: 40,
                    border: 'none',
                    outline: 'none',
                    background: 'none',
                    color: viewMode === 'clients' ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: 28,
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                >
                  Clients
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: 180, marginBottom: 0 }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} barCategoryGap={40}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 18, fill: '#222', fontWeight: 700 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 16, fill: '#bdbdbd', fontWeight: 600 }}
                    width={60}
                    tickFormatter={v => viewMode === 'revenue' ? `₹${(v/1000).toFixed(1)}K` : v}
                  />
                  <Tooltip
                    formatter={(value: number) => viewMode === 'revenue' ? [`₹${value.toLocaleString()}`, 'Revenue'] : [value, 'Clients']}
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e0e7ef', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: '#ff7a2f', fontWeight: 700 }}
                  />
                  <Bar
                    dataKey={viewMode === 'revenue' ? 'revenue' : 'clients'}
                    radius={[12, 12, 0, 0]}
                    fill={colors.primary}
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
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
      <CoachFooter />
    </main>
  );
};

export default RevenueTracker;
