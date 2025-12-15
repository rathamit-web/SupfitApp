import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { colors, typography, shadows, spacing, borderRadius, transitions } from '@/lib/designSystem';
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  FileText,
  Utensils,
  CheckCircle,
  Scale,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import Footer from '@/components/Footer';

const ClientDetail = () => {
  const navigate = useNavigate();

  // Mock client data
  const client = {
    name: 'Amit Rath',
    program: 'Weight Loss Program',
    phone: '+91 98765 43210',
    email: 'amit.rath@email.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    status: 'Active',
    week: 'Week 8/12',
    plan: 'Premium',
    progress: {
      currentWeight: '78 kg',
      targetWeight: '74 kg',
      weightLoss: '↓ 8 kg loss',
      toGo: '4 kg to go',
      sessionsDone: '32/48',
      sessionsProgress: '67% complete',
      attendance: '94%',
      attendanceStatus: 'Excellent',
    },
    bodyMetrics: {
      bodyFat: { value: '18%', change: '↓ 5%' },
      muscleMass: { value: '35 kg', change: '↑ 2kg' },
      bmi: { value: '24.2', status: 'Normal' },
    },
    weightProgress: 67,
    dietPlan: {
      dailyCalories: '2,000 kcal',
      macroSplit: '40% C / 30% P / 30% F',
      meals: [
        {
          type: 'Breakfast',
          icon: '🍳',
          description: 'Oatmeal, eggs, fruit',
          calories: '450 kcal',
        },
        {
          type: 'Lunch',
          icon: '🥗',
          description: 'Grilled chicken, quinoa, veggies',
          calories: '650 kcal',
        },
        {
          type: 'Dinner',
          icon: '🍽️',
          description: 'Fish, sweet potato, salad',
          calories: '600 kcal',
        },
      ],
    },
    recentActivity: [
      {
        id: 1,
        type: 'workout',
        title: 'Completed Workout',
        description: 'Strength Training - Upper Body',
        date: 'Nov 15, 2025 • 9:30 AM',
        completed: true,
      },
      {
        id: 2,
        type: 'weight',
        title: 'Weight Check-In',
        description: '78 kg (↓ 1 kg from last week)',
        date: 'Nov 13, 2025 • 7:00 AM',
        completed: false,
      },
      {
        id: 3,
        type: 'message',
        title: 'Sent Message',
        description: '"Can we adjust tomorrow\'s session time?"',
        date: 'Nov 12, 2025 • 6:45 PM',
        completed: false,
      },
    ],
    paymentHistory: [
      {
        id: 1,
        description: 'Monthly Subscription',
        date: '15 Oct 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 2,
        description: 'Monthly Subscription',
        date: '15 Sep 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 3,
        description: 'Monthly Subscription',
        date: '15 Aug 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
    ],
    suggestions: [
      {
        id: 1,
        icon: Dumbbell,
        title: 'Protein Recommendations',
        color: 'bg-green-100 text-green-600',
      },
      { id: 2, icon: Flame, title: 'Workout Guidance', color: 'bg-blue-100 text-blue-600' },
      { id: 3, icon: Utensils, title: 'Diet Plans', color: 'bg-red-100 text-red-600' },
    ],
  };


  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.background.subtle} 0%, ${colors.background.muted} 100%)`,
        fontFamily: typography.fontFamily.system,
        paddingBottom: '80px',
        letterSpacing: typography.letterSpacing.tighter,
      }}
    >
      <PageContainer>
        {/* Header with gradient background */}
        <header
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '0.5px solid rgba(0,0,0,0.05)',
            boxShadow: shadows.md,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, #60a5fa 0%, #a259ff 100%)`,
              opacity: 0.08,
              zIndex: 0,
              filter: 'blur(32px)',
            }}
          />
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: `${spacing[32]} ${spacing[20]} ${spacing[20]}`, position: 'relative', zIndex: 1 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: borderRadius.md,
                padding: `${spacing[8]} ${spacing[18]}`,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                marginBottom: spacing[18],
                cursor: 'pointer',
                boxShadow: shadows.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[8],
                transition: transitions.fast,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(96,165,250,0.12)`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
            >
              <ArrowLeft style={{ width: '18px', height: '18px' }} /> Back
            </button>

            {/* Profile Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: spacing[8] }}>
              <div style={{ position: 'relative', marginBottom: spacing[12] }}>
                <Avatar
                  style={{
                    width: '96px',
                    height: '96px',
                    background: 'rgba(255,255,255,0.35)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    boxShadow: shadows.sm,
                  }}
                >
                  <AvatarImage src={client.avatar} />
                  <AvatarFallback>{client.name[0]}</AvatarFallback>
                </Avatar>
                {/* Removed green check icon */}
              </div>
              <h1
                style={{
                  fontSize: 'clamp(28px, 5vw, 48px)',
                  fontWeight: typography.fontWeight.bold,
                  letterSpacing: typography.letterSpacing.tight,
                  color: colors.primary,
                  marginBottom: spacing[8],
                  lineHeight: '1.1',
                }}
              >
                {client.name}
              </h1>
              <p
                style={{
                  fontSize: 'clamp(14px, 2vw, 17px)',
                  color: colors.text.secondary,
                  fontWeight: typography.fontWeight.normal,
                  lineHeight: '1.4',
                }}
              >
                {client.program}
              </p>

              {/* Contact info hidden for privacy */}

              <div style={{ display: 'flex', gap: spacing[12], marginTop: spacing[16] }}>
                <span style={{
                  background: colors.primary, color: '#fff', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, padding: `${spacing[8]} ${spacing[16]}`, borderRadius: borderRadius.lg,
                }}>{client.status}</span>
                <span style={{
                  background: colors.primary, color: '#fff', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, padding: `${spacing[8]} ${spacing[16]}`, borderRadius: borderRadius.lg,
                }}>{client.week}</span>
                <span style={{
                  background: colors.primary, color: '#fff', fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.sm, padding: `${spacing[8]} ${spacing[16]}`, borderRadius: borderRadius.lg,
                }}>{client.plan}</span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: `${spacing[24]} ${spacing[20]} 0`, display: 'flex', flexDirection: 'column', gap: spacing[24] }}>
          {/* Apple-style Stats Section */}
          <section style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: spacing[32] }}>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[18] }}>Progress Overview</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[18] }}>
              {/* Active Clients (mocked as Sessions Done) */}
              <div style={{
                background: 'rgba(255,255,255,0.72)',
                borderRadius: borderRadius['2xl'],
                boxShadow: shadows.sm,
                padding: spacing[18],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[12],
                minWidth: '140px',
                flex: '1 1 140px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '0.5px solid rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
              }}>
                <div style={{
                  padding: spacing[8], borderRadius: borderRadius.lg, background: 'linear-gradient(135deg, #f5f5f7 0%, #e5e5ea 100%)', boxShadow: shadows.xs, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Dumbbell style={{ width: '22px', height: '22px', color: colors.text.primary, strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary, fontFamily: 'inherit', letterSpacing: typography.letterSpacing.tight, marginBottom: 0 }}>{client.progress.sessionsDone}</p>
                  <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, fontFamily: 'inherit', marginTop: spacing[2] }}>Sessions Done</p>
                </div>
              </div>
              {/* Years Experience (mocked as Weeks) */}
              <div style={{
                background: 'rgba(255,255,255,0.72)',
                borderRadius: borderRadius['2xl'],
                boxShadow: shadows.sm,
                padding: spacing[18],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[12],
                minWidth: '140px',
                flex: '1 1 140px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '0.5px solid rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
              }}>
                <div style={{
                  padding: spacing[8], borderRadius: borderRadius.lg, background: 'linear-gradient(135deg, #f5f5f7 0%, #e5e5ea 100%)', boxShadow: shadows.xs, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar style={{ width: '22px', height: '22px', color: colors.text.primary, strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary, fontFamily: 'inherit', letterSpacing: typography.letterSpacing.tight, marginBottom: 0 }}>{client.week}</p>
                  <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, fontFamily: 'inherit', marginTop: spacing[2] }}>Program Week</p>
                </div>
              </div>
              {/* Rating (mocked as Attendance) */}
              <div style={{
                background: 'rgba(255,255,255,0.72)',
                borderRadius: borderRadius['2xl'],
                boxShadow: shadows.sm,
                padding: spacing[18],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[12],
                minWidth: '140px',
                flex: '1 1 140px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '0.5px solid rgba(0,0,0,0.04)',
                fontFamily: 'inherit',
              }}>
                <div style={{
                  padding: spacing[8], borderRadius: borderRadius.lg, background: 'linear-gradient(135deg, #f5f5f7 0%, #e5e5ea 100%)', boxShadow: shadows.xs, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle style={{ width: '22px', height: '22px', color: colors.text.primary, strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary, fontFamily: 'inherit', letterSpacing: typography.letterSpacing.tight, marginBottom: 0 }}>{client.progress.attendance}</p>
                  <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, fontFamily: 'inherit', marginTop: spacing[2] }}>Attendance</p>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: spacing[24] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[16] }}>
              <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tight, color: colors.text.primary }}>
                Body Metrics
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing[12], marginBottom: spacing[16] }}>
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[16],
                textAlign: 'center',
                boxShadow: shadows.lg,
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                  padding: spacing[8],
                  borderRadius: borderRadius.lg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[8],
                }}>
                  <Scale style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Body Fat</p>
                <p style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: spacing[4] }}>
                  {client.bodyMetrics.bodyFat.value}
                </p>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.primary }}>{client.bodyMetrics.bodyFat.change}</p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[16],
                textAlign: 'center',
                boxShadow: shadows.lg,
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #4ade80, #34d399)',
                  padding: spacing[8],
                  borderRadius: borderRadius.lg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[8],
                }}>
                  <Dumbbell style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Muscle Mass</p>
                <p style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: spacing[4] }}>
                  {client.bodyMetrics.muscleMass.value}
                </p>
                <p style={{ fontSize: typography.fontSize.xs, color: '#34c759' }}>{client.bodyMetrics.muscleMass.change}</p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[16],
                textAlign: 'center',
                boxShadow: shadows.lg,
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                  padding: spacing[8],
                  borderRadius: borderRadius.lg,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[8],
                }}>
                  <Heart style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>BMI</p>
                <p style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary, marginBottom: spacing[4] }}>{client.bodyMetrics.bmi.value}</p>
                <p style={{ fontSize: typography.fontSize.xs, color: '#34c759' }}>{client.bodyMetrics.bmi.status}</p>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: borderRadius['2xl'],
              padding: spacing[16],
              boxShadow: shadows.lg,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[8] }}>
                <span style={{ fontSize: typography.fontSize.base, color: colors.text.secondary }}>Weight Progress</span>
                <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.primary }}>{client.weightProgress}% to goal</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: borderRadius.sm,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: '#FF3C20',
                  borderRadius: '3px',
                  width: `${client.weightProgress}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          </section>

          {/* Diet Plan */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px', color: '#1d1d1f' }}>
                Diet Plan
              </h2>
              <Button
                style={{
                  background: '#FF3C20',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 24px 0 rgba(255, 60, 32, 0.18)',
                  padding: '10px 28px',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                  WebkitBackdropFilter: 'blur(12px)',
                  backdropFilter: 'blur(12px)',
                  outline: 'none',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#e13a00';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#FF3C20';
                }}
              >
                Edit Plan
              </Button>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[16] }}>
                <div>
                  <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Daily Calorie Target</p>
                  <p style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary }}>
                    {client.dietPlan.dailyCalories}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Macro Split</p>
                  <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                    {client.dietPlan.macroSplit}
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[12] }}>
                {client.dietPlan.meals.map((meal) => (
                  <div
                    key={meal.type}
                    style={{
                      background: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: borderRadius.lg,
                      padding: spacing[12],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                        padding: spacing[6],
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Utensils style={{ width: '14px', height: '14px', color: '#ffffff' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{meal.type}</p>
                        <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>{meal.description}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.primary }}>{meal.calories}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Activity (Apple Card Style) */}
          <section style={{ marginBottom: '32px', background: '#f6f2fc', borderRadius: '16px', padding: '24px 0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#23223b', margin: '0 0 18px 20px', letterSpacing: '-0.5px' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '0 20px' }}>
              {client.recentActivity.map((activity) => {
                const iconMap = {
                  workout: { gradient: 'linear-gradient(135deg, #c084fc, #f472b6)', Icon: Dumbbell },
                  weight: { gradient: 'linear-gradient(135deg, #60a5fa, #22d3ee)', Icon: Scale },
                  message: { gradient: 'linear-gradient(135deg, #fb923c, #fbbf24)', Icon: MessageSquare },
                };
                const { gradient, Icon } = iconMap[activity.type] || {};
                return (
                  <div key={activity.id} style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(192,132,252,0.06)', display: 'flex', alignItems: 'center', padding: '18px 20px', gap: '18px' }}>
                    <div style={{ background: gradient, borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
                        <span style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base, color: colors.text.primary }}>{activity.title}</span>
                        {activity.completed && <CheckCircle style={{ width: '18px', height: '18px', color: '#34c759' }} />}
                      </div>
                      <div style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginTop: spacing[2] }}>{activity.description}</div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginTop: spacing[4] }}>{activity.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Coach Notes */}
          <section style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: spacing[32] }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Coach Notes</h2>
              <Button variant="ghost" size="sm" style={{ color: colors.primary }}>
                Add Note
              </Button>
            </div>
          </section>

          {/* Subscription & Payment Section - Compact */}
          <section style={{ marginBottom: spacing[32] }}>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[16] }}>Subscription & Payment (Last 3 Months)</h2>
            <div style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              boxShadow: shadows.sm,
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 80px',
                gap: spacing[12],
                padding: `${spacing[12]} ${spacing[16]}`,
                background: 'rgba(255, 60, 32, 0.05)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Description</div>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary, textAlign: 'center' }}>Amount</div>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary, textAlign: 'center' }}>Date</div>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.text.primary, textAlign: 'center' }}>Status</div>
              </div>

              {/* Table Rows */}
              <div>
                {client.paymentHistory.map((payment, index) => {
                  const isOverdue = payment.status === 'Overdue' || payment.status === 'Due';
                  const isPaid = payment.status === 'Completed' || payment.status === 'Paid';
                  
                  let rowBackground = 'transparent';
                  if (isOverdue) {
                    rowBackground = 'rgba(244, 67, 54, 0.03)';
                  } else if (isPaid) {
                    rowBackground = 'rgba(52, 199, 89, 0.03)';
                  }
                  
                  let statusBgColor = 'rgba(255, 152, 0, 0.15)';
                  if (isPaid) {
                    statusBgColor = 'rgba(52, 199, 89, 0.15)';
                  } else if (isOverdue) {
                    statusBgColor = 'rgba(244, 67, 54, 0.15)';
                  }
                  
                  let statusTextColor = '#ff9500';
                  if (isPaid) {
                    statusTextColor = '#34c759';
                  } else if (isOverdue) {
                    statusTextColor = '#f44336';
                  }
                  return (
                    <div
                      key={payment.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 100px 80px',
                        gap: spacing[12],
                        padding: `${spacing[12]} ${spacing[16]}`,
                        borderBottom: index < client.paymentHistory.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                        alignItems: 'center',
                        background: rowBackground,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                          {payment.description}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: isOverdue ? '#f44336' : colors.text.primary }}>
                          {payment.amount}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                          {payment.date}
                        </p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: `${spacing[4]} ${spacing[8]}`,
                          borderRadius: borderRadius.md,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.semibold,
                          background: statusBgColor,
                          color: statusTextColor,
                        }}>
                          {isPaid && <CheckCircle style={{ width: '12px', height: '12px', marginRight: spacing[4] }} />}
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing[12], marginTop: spacing[16] }}>
              <div style={{
                background: 'rgba(52, 199, 89, 0.1)',
                border: '1px solid rgba(52, 199, 89, 0.3)',
                borderRadius: borderRadius.md,
                padding: spacing[12],
                textAlign: 'center',
              }}>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Paid</p>
                <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#34c759' }}>₹{client.paymentHistory.filter(p => p.status === 'Completed' || p.status === 'Paid').reduce((sum, p) => sum + Number.parseInt(p.amount.replace('₹', '').replace(',', ''), 10), 0).toLocaleString()}</p>
              </div>
              <div style={{
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: borderRadius.md,
                padding: spacing[12],
                textAlign: 'center',
              }}>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginBottom: spacing[4] }}>Due/Overdue</p>
                <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: '#f44336' }}>₹{client.paymentHistory.filter(p => p.status === 'Overdue' || p.status === 'Due').reduce((sum, p) => sum + Number.parseInt(p.amount.replace('₹', '').replace(',', ''), 10), 0).toLocaleString()}</p>
              </div>
            </div>
          </section>

          {/* Suggestions */}
          <section style={{ marginBottom: spacing[32] }}>
            <h2 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, letterSpacing: typography.letterSpacing.tight, color: colors.text.primary, marginBottom: spacing[16] }}>Suggestions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing[12] }}>
              {client.suggestions.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: borderRadius.lg,
                      padding: spacing[16],
                      boxShadow: shadows.sm,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                      <div style={{
                        background: colors.primary,
                        padding: spacing[8],
                        borderRadius: borderRadius.md,
                        boxShadow: shadows.xs,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
                      </div>
                      <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>{suggestion.title}</span>
                    </div>
                    <ChevronRight style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Action Buttons */}
          <section style={{ marginBottom: spacing[32] }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
              <button
                style={{
                  width: '100%',
                  background: colors.primary,
                  color: '#fff',
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.lg,
                  padding: `${spacing[14]} 0`,
                  borderRadius: borderRadius.lg,
                  border: 'none',
                  boxShadow: shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[10],
                  cursor: 'pointer',
                  transition: transitions.normal,
                }}
              >
                <MessageSquare style={{ width: '18px', height: '18px', marginRight: spacing[8] }} />
                Message Client
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[12] }}>
                <button
                  style={{
                    background: '#fff',
                    color: colors.primary,
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.base,
                    padding: `${spacing[12]} 0`,
                    borderRadius: borderRadius.lg,
                    border: `1.5px solid ${colors.primary}`,
                    boxShadow: shadows.xs,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[8],
                    cursor: 'pointer',
                  }}
                >
                  <Calendar style={{ width: '16px', height: '16px', marginRight: spacing[6] }} />
                  Schedule Session
                </button>
                <button
                  style={{
                    background: '#fff',
                    color: colors.primary,
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.base,
                    padding: `${spacing[12]} 0`,
                    borderRadius: borderRadius.lg,
                    border: `1.5px solid ${colors.primary}`,
                    boxShadow: shadows.xs,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[8],
                    cursor: 'pointer',
                  }}
                >
                  <FileText style={{ width: '16px', height: '16px', marginRight: spacing[6] }} />
                  View Reports
                </button>
              </div>
              <button
                style={{
                  width: '100%',
                  background: '#fff',
                  color: colors.primary,
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.lg,
                  padding: `${spacing[14]} 0`,
                  borderRadius: borderRadius.lg,
                  border: `1.5px solid ${colors.primary}`,
                  boxShadow: shadows.xs,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[10],
                  cursor: 'pointer',
                }}
              >
                <Utensils style={{ width: '18px', height: '18px', marginRight: spacing[8] }} />
                Update Diet
              </button>
            </div>
          </section>
        </div>
      </PageContainer>

      <Footer />
    </main>
  );
};

export default ClientDetail;
