// File removed: Plan.tsx is not used anywhere in the project (web navigation and imports reference other files or PlanNative.tsx for mobile).
import { useState, useEffect } from 'react';
import {
  Flame,
  Droplets,
  Play,
  Dumbbell,
  Clock,
  Zap,
  Sparkles,
  Home,
  LayoutDashboard,
  User,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

const Plan = () => {
  const [hasCoachSubscription, setHasCoachSubscription] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'coach' | 'ai'>('coach');

  useEffect(() => {
    const coachSub = localStorage.getItem('coachSubscription');
    const hasCoach = !!coachSub;
    setHasCoachSubscription(hasCoach);
    setSelectedPlan(hasCoach ? 'coach' : 'ai');
  }, []);

  const { id } = useParams();
  const userId = id || 'default';

  // Supplement Plan from localStorage
  const [supplementPlan, setSupplementPlan] = useState(() => {
    const saved = localStorage.getItem(`supplementPlan_${userId}`);
    if (!saved) return null;
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) return arr;
      return null;
    } catch {
      return null;
    }
  });
  const coachWorkouts = [
    {
      id: 1,
      name: 'Barbell Bench Press',
      sets: '4 sets of 8-10 reps',
      duration: '15 mins',
      calories: 180,
      videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    },
    {
      id: 2,
      name: 'Incline Dumbbell Press',
      sets: '3 sets of 10-12 reps',
      duration: '12 mins',
      calories: 140,
      videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
    },
    {
      id: 3,
      name: 'Cable Fly',
      sets: '3 sets of 12-15 reps',
      duration: '10 mins',
      calories: 100,
      videoUrl: 'https://www.youtube.com/watch?v=Iwe6AmxVf7o',
    },
    {
      id: 4,
      name: 'Tricep Pushdown',
      sets: '3 sets of 12 reps',
      duration: '8 mins',
      calories: 85,
      videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    },
    {
      id: 5,
      name: 'Overhead Tricep Extension',
      sets: '3 sets of 10-12 reps',
      duration: '10 mins',
      calories: 95,
      videoUrl: 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
    },
  ];

  const totalCalories = coachWorkouts.reduce((sum, ex) => sum + ex.calories, 0);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        paddingBottom: '80px',
      }}
    >
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Plan Selection Cards */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}
        >
          {/* Coach Suggested Card */}
          <div
            onClick={() => hasCoachSubscription && setSelectedPlan('coach')}
            style={{
              background:
                selectedPlan === 'coach' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '20px',
              border:
                selectedPlan === 'coach' ? '2px solid #8b5cf6' : '1px solid rgba(0, 0, 0, 0.06)',
              cursor: hasCoachSubscription ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: hasCoachSubscription ? 1 : 0.6,
              position: 'relative',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background:
                      'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                      margin: '0 0 4px 0',
                    }}
                  >
                    Coach Suggested
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                    Personalized plan from Coach William
                  </p>
                </div>
              </div>
              {selectedPlan === 'coach' && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  fontSize: '13px',
                  color: '#1d1d1f',
                  fontWeight: '500',
                }}
              >
                All Plan
              </span>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  fontSize: '13px',
                  color: '#1d1d1f',
                  fontWeight: '500',
                }}
              >
                Strength Focus
              </span>
            </div>
          </div>

          {/* AI Recommended Card */}
          <div
            onClick={() => setSelectedPlan('ai')}
            style={{
              background:
                selectedPlan === 'ai' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '20px',
              border: selectedPlan === 'ai' ? '2px solid #8b5cf6' : '1px solid rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background:
                      'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                      margin: '0 0 4px 0',
                    }}
                  >
                    AI Recommended
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                    Based on your health data and AI analysis
                  </p>
                </div>
              </div>
              {selectedPlan === 'ai' && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIGenerator(true);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(255, 60, 32, 0.3)',
                }}
              >
                <Sparkles style={{ width: '14px', height: '14px' }} />
                Generate AI Plan
              </button>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  fontSize: '13px',
                  color: '#1d1d1f',
                  fontWeight: '500',
                }}
              >
                Cardio + Core
              </span>
            </div>
          </div>
        </div>

        {selectedPlan === 'coach' && hasCoachSubscription ? (
          <>
            {/* Calorie Goal Card */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(255, 60, 32, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '20px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 60, 32, 0.1)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#6e6e73',
                      margin: '0 0 8px 0',
                      fontWeight: '500',
                    }}
                  >
                    Today's Burn Goal
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#ff3c20',
                        lineHeight: 1,
                      }}
                    >
                      {totalCalories}
                    </span>
                    <span style={{ fontSize: '18px', color: '#6e6e73', fontWeight: '600' }}>
                      kcal
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Flame style={{ width: '40px', height: '40px', color: '#ff3c20' }} />
                </div>
              </div>
            </div>

            {/* Workout Day Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.72)',
                borderRadius: '16px',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Dumbbell style={{ width: '20px', height: '20px', color: '#ffffff' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f', margin: 0 }}>
                  Monday: Chest & Triceps
                </h2>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Assigned by Coach Sarah
                </p>
              </div>
            </div>

            {/* Workout Exercises */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {coachWorkouts.map((workout, index) => (
                <div
                  key={workout.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${
                          index % 3 === 0
                            ? 'rgba(255, 60, 32, 0.15)'
                            : index % 3 === 1
                              ? 'rgba(52, 199, 89, 0.15)'
                              : 'rgba(0, 122, 255, 0.15)'
                        }, ${
                          index % 3 === 0
                            ? 'rgba(255, 149, 0, 0.15)'
                            : index % 3 === 1
                              ? 'rgba(48, 209, 88, 0.15)'
                              : 'rgba(10, 132, 255, 0.15)'
                        })`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f' }}>
                        {index + 1}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: '#1d1d1f',
                          margin: '0 0 8px 0',
                        }}
                      >
                        {workout.name}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '12px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap style={{ width: '14px', height: '14px', color: '#ff3c20' }} />
                          <span style={{ fontSize: '13px', color: '#6e6e73' }}>{workout.sets}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock style={{ width: '14px', height: '14px', color: '#007aff' }} />
                          <span style={{ fontSize: '13px', color: '#6e6e73' }}>
                            {workout.duration}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Flame style={{ width: '14px', height: '14px', color: '#ff9500' }} />
                          <span style={{ fontSize: '13px', color: '#6e6e73', fontWeight: '600' }}>
                            {workout.calories} kcal
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(workout.videoUrl, '_blank')}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 4px 12px rgba(255, 60, 32, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 60, 32, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 60, 32, 0.25)';
                        }}
                      >
                        <Play style={{ width: '16px', height: '16px' }} />
                        Watch Tutorial
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coach Instructions */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '20px',
                border: '1px solid rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}
              >
                <MessageCircle style={{ width: '24px', height: '24px', color: '#ff3c20' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f', margin: 0 }}>
                  Coach Instructions
                </h2>
              </div>
              <div
                style={{
                  background: 'rgba(255, 60, 32, 0.05)',
                  borderRadius: '16px',
                  padding: '16px',
                  borderLeft: '4px solid #ff3c20',
                }}
              >
                <p style={{ fontSize: '15px', color: '#1d1d1f', margin: 0, lineHeight: 1.6 }}>
                  Focus on controlled movements today. Keep your core engaged throughout each
                  exercise. Rest 60-90 seconds between sets. If you feel any sharp pain, stop
                  immediately and contact me.
                </p>
              </div>
            </div>

            {/* Supplement Plan */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(48, 209, 88, 0.1) 100%)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '20px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(52, 199, 89, 0.2)',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1d1d1f',
                  margin: '0 0 16px 0',
                }}
              >
                💊 Supplement Plan
              </h2>
              {supplementPlan && supplementPlan.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '8px',
                  }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#34c759', margin: '0 0 6px 0' }}>{supplementPlan[0].title}</h3>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 2px 0' }}>Pre-Workout</p>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                          {supplementPlan[0].pre.map((item, i) => (
                            <li key={i} style={{ fontSize: '13px', color: '#6e6e73', marginBottom: 2 }}>
                              {item.label} <span style={{ color: '#34c759' }}>({item.note})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 2px 0' }}>Post-Workout</p>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                          {supplementPlan[0].post.map((item, i) => (
                            <li key={i} style={{ fontSize: '13px', color: '#6e6e73', marginBottom: 2 }}>
                              {item.label} <span style={{ color: '#34c759' }}>({item.note})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6e6e73', fontSize: '14px' }}>No supplement plan recommended yet.</div>
              )}
            </div>

            {/* Hydration */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(0, 122, 255, 0.1) 0%, rgba(10, 132, 255, 0.1) 100%)',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '20px',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 122, 255, 0.2)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                      margin: '0 0 8px 0',
                    }}
                  >
                    💧 Hydration Goal
                  </h2>
                  <p style={{ fontSize: '15px', color: '#6e6e73', margin: '0 0 12px 0' }}>
                    During workout
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#007aff',
                        lineHeight: 1,
                      }}
                    >
                      500
                    </span>
                    <span style={{ fontSize: '16px', color: '#6e6e73', fontWeight: '600' }}>
                      ml
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '18px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Droplets style={{ width: '36px', height: '36px', color: '#007aff' }} />
                </div>
              </div>
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: '12px',
                }}
              >
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  💡 Add electrolytes if workout exceeds 60 minutes
                </p>
              </div>
            </div>
          </>
        ) : selectedPlan === 'ai' ? (
          // AI Generator
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              padding: '40px 32px',
              textAlign: 'center',
              border: '1px solid rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background:
                  'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <Sparkles style={{ width: '40px', height: '40px', color: '#8b5cf6' }} />
            </div>
            <h2
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1d1d1f',
                margin: '0 0 12px 0',
              }}
            >
              Generate Your Workout Plan
            </h2>
            <p
              style={{ fontSize: '16px', color: '#6e6e73', margin: '0 0 32px 0', lineHeight: 1.6 }}
            >
              Get a personalized AI-powered workout plan based on your fitness goals, experience
              level, and available equipment.
            </p>
            <button
              onClick={() => setShowAIGenerator(true)}
              style={{
                padding: '16px 32px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                color: '#ffffff',
                fontSize: '17px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px rgba(255, 60, 32, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 60, 32, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 60, 32, 0.3)';
              }}
            >
              <Sparkles style={{ width: '20px', height: '20px' }} />
              Generate AI Plan
            </button>
            {!hasCoachSubscription && (
              <div
                style={{
                  marginTop: '32px',
                  padding: '20px',
                  background: 'rgba(255, 149, 0, 0.1)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 149, 0, 0.2)',
                }}
              >
                <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                  💡 Want expert guidance? Subscribe to a coach for personalized plans and real-time
                  support!
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer Navigation */}
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
          { icon: Home, path: '/home' },
          { icon: Dumbbell, path: '/plan' },
          { icon: LayoutDashboard, path: '/coach-home' },
          { icon: User, path: '/settings' },
        ].map((item, index) => {
          const isActive = window.location.pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => (window.location.href = item.path)}
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
              <item.icon style={{ width: '24px', height: '24px', strokeWidth: 1.5 }} />
            </button>
          );
        })}
      </div>
    </main>
  );
};

export default Plan;
