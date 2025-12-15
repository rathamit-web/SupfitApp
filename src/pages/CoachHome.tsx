import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { colors, typography, shadows, spacing, borderRadius, transitions } from '@/lib/designSystem';
import {
  Heart,
  Share2,
  Edit2,
  Edit3,
  MessageCircle,
  Video,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus2,
  Star,
  Home,
  User
} from 'lucide-react';
import RevenueTrackerIcon from '@/components/RevenueTrackerIcon';

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';

const posts = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    likes: 234,
    comments: 12,
    caption: 'Morning cardio session with clients 💪',
    workout: 'Training',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    likes: 189,
    comments: 8,
    caption: 'Group strength training today 🔥',
    workout: 'Strength',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    likes: 312,
    comments: 15,
    caption: 'Client transformation results! 💯',
    workout: 'Results',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    likes: 276,
    comments: 19,
    caption: 'Yoga & flexibility session 🧘',
    workout: 'Yoga',
  },
];

const CoachHome = () => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>(() => {
    const savedImage = localStorage.getItem('coachProfileImage');
    return savedImage || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workoutPosts, setWorkoutPosts] = useState(posts);
  // Use a ref object for workout file inputs
  const workoutFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  // State for editing posts
  // Removed unused editingPost, editCaption, editWorkout state

  useEffect(() => {
    localStorage.setItem('coachProfileImage', profileImage);
  }, [profileImage]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Removed unused handleAddWorkoutPhoto

  const stats = [
    { label: 'Active Clients', value: '48', icon: UserPlus2 },
    { label: 'Years Experience', value: '7', unit: 'yrs', icon: Clock },
    { label: 'Rating', value: '4.9', unit: '★', icon: Star },
  ];

  const activeClients = [
    {
      id: 1,
      name: 'Pathik',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      isNew: true,
    },
    {
      id: 2,
      name: 'Amit',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      isNew: false,
    },
    {
      id: 3,
      name: 'Hari',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      isNew: false,
    },
    {
      id: 4,
      name: 'Krishna',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      isNew: false,
    },
    {
      id: 5,
      name: 'Ravi',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
      isNew: false,
    },
    {
      id: 6,
      name: 'Priya',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      isNew: true,
    },
  ];

  const todaySchedule = [
    {
      id: 1,
      name: 'Jane Doe',
      time: '10:00 AM',
      location: 'City Gym',
      type: 'in-person',
      status: 'attend',
    },
    {
      id: 2,
      name: 'Mike Ross',
      time: '11:30 AM',
      location: 'Online',
      type: 'online',
      status: 'absent',
    },
    {
      id: 3,
      name: 'Sarah Chen',
      time: '2:00 PM',
      location: 'Online',
      type: 'online',
      status: 'attend',
    },
  ];

  const payments = [
    {
      id: 1,
      name: 'Alex Chen',
      amount: '₹150.00',
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
    {
      id: 2,
      name: 'Sarah Lee',
      amount: '₹200.00',
      status: 'overdue',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 3,
      name: 'David Kim',
      amount: '₹150.00',
      status: 'received',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    },
  ];

  const messages = [
    {
      id: 1,
      name: 'Emily Carter',
      message: 'Great, see you tomorrow at 10!',
      time: '10m ago',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    },
    {
      id: 2,
      name: 'Liam Johnson',
      message: "I'll have to reschedule my session this...",
      time: '1h ago',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    },
    {
      id: 3,
      name: 'Sophia Brown',
      message: 'Thanks for the diet plan update!',
      time: '2h ago',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
  ];

  // Removed unused getPaymentStatusColor

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
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
      {/* Hero Profile Section */}
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${colors.primary} 0%, #ff5722 100%)`,
            opacity: 0.08,
            zIndex: 0,
            filter: 'blur(32px)',
          }}
        />
        <div
          className="container mx-auto px-4 py-8 relative"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Avatar */}
            <div className="relative group">
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                  borderRadius: '50%',
                  filter: 'blur(32px)',
                  opacity: 0.18,
                  zIndex: 0,
                }}
              />
              <Avatar
                className="w-40 h-40 md:w-48 md:h-48 border-4 border-white/30 relative"
                style={{
                  boxShadow: '0 8px 32px rgba(255,60,32,0.10)',
                  background: 'rgba(255,255,255,0.35)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage src={profileImage} />
                <AvatarFallback>JM</AvatarFallback>
              </Avatar>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  padding: 0,
                }}
                aria-label="Edit profile picture"
              >
                <Edit2 style={{ width: '16px', height: '16px', color: colors.primary }} />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1
                  style={{
                    fontSize: typography.fontSize['7xl'],
                    fontWeight: typography.fontWeight.bold,
                    marginBottom: spacing[8],
                    background: `linear-gradient(90deg, ${colors.primary} 0%, #ff5722 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  John Martinez
                </h1>
                <p style={{ color: colors.text.secondary, fontSize: typography.fontSize.lg }}>
                  Certified Fitness Coach • Nutritionist
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px' }}>
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      style={{
                        background: 'rgba(255,255,255,0.72)',
                        borderRadius: borderRadius.xl,
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
                        fontFamily: typography.fontFamily.system,
                      }}
                    >
                      <div
                        style={{
                          padding: spacing[8],
                          borderRadius: borderRadius.lg,
                          background: 'linear-gradient(135deg, #f5f5f7 0%, #e5e5ea 100%)',
                          boxShadow: shadows.xs,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon style={{ width: '22px', height: '22px', color: colors.text.primary, strokeWidth: 2 }} />
                      </div>
                      <div>
                        <p style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, fontFamily: 'inherit', letterSpacing: typography.letterSpacing.tight, marginBottom: 0 }}>
                          {stat.value}
                          {stat.unit && (
                            <span style={{ fontSize: typography.fontSize.base, marginLeft: spacing[4], color: colors.text.secondary, fontWeight: typography.fontWeight.normal }}>
                              {stat.unit}
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, fontFamily: 'inherit', marginTop: spacing[2] }}>{stat.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>{' '}
          {/* Close flex-col md:flex-row items-start gap-8 */}
        </div>{' '}
        {/* Close container mx-auto px-4 py-8 relative */}
      </header>
      {/* Recent Workouts Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: spacing[24], marginTop: spacing[32] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              letterSpacing: typography.letterSpacing.tight,
              color: colors.text.primary,
            }}
          >
            Recent Workouts
          </h2>
          <span
            style={{
              padding: `${spacing[8]} ${spacing[16]}`,
              borderRadius: borderRadius.lg,
              background: `rgba(${Number.parseInt(colors.primary.substring(1, 3), 16)}, ${Number.parseInt(colors.primary.substring(3, 5), 16)}, ${Number.parseInt(colors.primary.substring(5, 7), 16)}, 0.1)`,
              color: colors.primary,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.xs,
            }}
          >
            This Week: {workoutPosts.length} workouts
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: spacing[16],
          }}
        >
          {workoutPosts.map((post, idx) => (
            <div
              key={post.id}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: borderRadius['2xl'],
                overflow: 'hidden',
                boxShadow: shadows.lg,
                display: 'flex',
                flexDirection: 'column',
                transition: transitions.normal,
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
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={el => {
                    if (el) workoutFileInputRefs.current[post.id] = el;
                  }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const updated = workoutPosts.map(p =>
                          p.id === post.id ? { ...p, image: typeof reader.result === 'string' ? reader.result : p.image } : p
                        );
                        setWorkoutPosts(updated);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <img
                  src={post.image}
                  alt={post.caption}
                  style={{
                    width: '100%',
                    height: '240px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => workoutFileInputRefs.current[post.id]?.click()}
                />
                {/* Edit Image Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    workoutFileInputRefs.current[post.id]?.click();
                  }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: shadows.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: transitions.fast,
                    padding: 0,
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(${Number.parseInt(colors.primary.substring(1, 3), 16)}, ${Number.parseInt(colors.primary.substring(3, 5), 16)}, ${Number.parseInt(colors.primary.substring(5, 7), 16)}, 0.95)`;
                    e.currentTarget.style.transform = 'scale(1.1)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.transform = 'scale(1)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = colors.text.primary;
                  }}
                  aria-label="Edit workout image"
                >
                  <Edit2
                    style={{
                      width: '16px',
                      height: '16px',
                      color: colors.text.primary,
                      transition: transitions.fast,
                    }}
                  />
                </button>
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    padding: spacing[6],
                    borderRadius: borderRadius.md,
                    background: colors.primary,
                    color: '#ffffff',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    boxShadow: shadows.md,
                  }}
                >
                  {post.workout}
                </span>
              </div>
              <div
                style={{
                  padding: spacing[16],
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing[12],
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: spacing[8],
                  }}
                >
                  <p
                    style={{
                      fontWeight: typography.fontWeight.semibold,
                      fontSize: typography.fontSize.base,
                      color: colors.text.primary,
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {post.caption}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[16],
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.sm,
                    marginTop: 'auto',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                    <Heart style={{ width: '16px', height: '16px' }} />
                    {post.likes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                    <MessageCircle style={{ width: '16px', height: '16px' }} />
                    {post.comments}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[4],
                      marginLeft: 'auto',
                    }}
                  >
                    <Share2 style={{ width: '16px', height: '16px' }} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div>
        {/* All main sections: Stats, New Request, Active Clients, Today's Schedule, Payment Tracker, Messages */}

        {/* New Request Section */}
        <section className="space-y-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>New Request</h2>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.sm,
              padding: spacing[24],
              border: '0.5px solid rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[18],
            }}
          >
            {/* Example request, replace with dynamic data as needed */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing[18],
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.lg,
                    color: colors.text.primary,
                    marginBottom: spacing[4],
                  }}
                >
                  Subscription Request from <span style={{ color: colors.primary }}>Amit Sharma</span>
                </p>
                <p style={{ color: colors.text.secondary, fontSize: typography.fontSize.base, marginBottom: spacing[2] }}>
                  Plan: <span style={{ color: colors.primary, fontWeight: typography.fontWeight.semibold }}>Premium Diet Plan</span>
                </p>
                <p style={{ color: colors.text.secondary, fontSize: typography.fontSize.base }}>
                  Payment: <span style={{ color: colors.primary, fontWeight: typography.fontWeight.semibold }}>₹1200</span> •
                  Status: <span style={{ color: '#34c759', fontWeight: typography.fontWeight.semibold }}>Paid</span>
                </p>
              </div>
              {/* Removed View Details button */}
            </div>
          </div>
        </section>

        {/* Active Clients Section */}
        <section className="space-y-4">
          <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Active Clients</h2>
          <div style={{ display: 'flex', gap: spacing[24], overflowX: 'auto', paddingBottom: spacing[12] }}>
            {activeClients.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/client/${client.id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[8],
                  minWidth: '80px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.sm,
                  padding: `${spacing[12]} ${spacing[10]}`,
                  border: '0.5px solid rgba(0,0,0,0.04)',
                  position: 'relative',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ position: 'relative' }}>
                  {client.isNew && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: colors.primary,
                        color: '#fff',
                        fontSize: typography.fontSize.xs,
                        padding: `${spacing[2]} ${spacing[7]}`,
                        borderRadius: borderRadius.lg,
                        zIndex: 2,
                      }}
                    >
                      New
                    </span>
                  )}
                  <Avatar
                    style={{
                      width: '56px',
                      height: '56px',
                      border: '2px solid #fff',
                      boxShadow: shadows.sm,
                      background: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback>{client.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.normal, color: colors.text.primary }}>
                  {client.name}
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.primary, fontWeight: typography.fontWeight.semibold }}>Chat</span>
              </button>
            ))}
          </div>
        </section>

        {/* Today's Schedule Section */}
        <section className="space-y-4">
          <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Today's Schedule</h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.sm,
              padding: spacing[18],
              border: '0.5px solid rgba(0,0,0,0.04)',
            }}
          >
            {todaySchedule.map((session) => (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing[12],
                  borderRadius: borderRadius.lg,
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: spacing[8],
                  boxShadow: shadows.xs,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                  <div
                    style={{
                      padding: spacing[8],
                      borderRadius: '50%',
                      background: session.type === 'online' ? '#e3f0ff' : '#e3ffe3',
                    }}
                  >
                    {session.type === 'online' ? (
                      <Video style={{ width: '20px', height: '20px', color: '#2196f3' }} />
                    ) : (
                      <MapPin style={{ width: '20px', height: '20px', color: '#34c759' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: typography.fontWeight.normal, color: colors.text.primary, fontSize: typography.fontSize.lg }}>
                      {session.name}
                    </p>
                    <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {session.time} - {session.location}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    border: `1px solid ${session.status === 'attend' ? '#34c759' : colors.primary}`,
                    color: session.status === 'attend' ? '#34c759' : colors.primary,
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[4]} ${spacing[14]}`,
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.base,
                    background:
                      session.status === 'attend' ? 'rgba(52,199,89,0.08)' : `rgba(${Number.parseInt(colors.primary.substring(1, 3), 16)}, ${Number.parseInt(colors.primary.substring(3, 5), 16)}, ${Number.parseInt(colors.primary.substring(5, 7), 16)}, 0.06)`,
                  }}
                >
                  {session.status === 'attend' ? '✓ Attend' : '✗ Absent'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Tracker Section */}
        <section className="space-y-4">
          <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Payment Tracker</h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.sm,
              padding: spacing[18],
              border: '0.5px solid rgba(0,0,0,0.04)',
            }}
          >
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing[12],
                  borderRadius: borderRadius.lg,
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: spacing[8],
                  boxShadow: shadows.xs,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                  <Avatar
                    style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.72)' }}
                  >
                    <AvatarImage src={payment.avatar} />
                    <AvatarFallback>{payment.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p style={{ fontWeight: typography.fontWeight.normal, color: colors.text.primary, fontSize: typography.fontSize.lg }}>
                      {payment.name}
                    </p>
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color:
                          payment.status === 'pending'
                            ? '#ff9800'
                            : payment.status === 'overdue'
                              ? '#f44336'
                              : '#34c759',
                        fontWeight: typography.fontWeight.semibold,
                      }}
                    >
                      {payment.amount}{' '}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </p>
                  </div>
                </div>
                <span>{getPaymentStatusIcon(payment.status)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Messages Section */}
        <section className="space-y-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Messages</h2>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontWeight: typography.fontWeight.semibold,
                fontSize: typography.fontSize.base,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              View All
            </button>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.sm,
              padding: spacing[18],
              border: '0.5px solid rgba(0,0,0,0.04)',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[12],
                  padding: spacing[12],
                  borderRadius: borderRadius.lg,
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: spacing[8],
                  boxShadow: shadows.xs,
                }}
              >
                <Avatar
                  style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.72)' }}
                >
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback>{msg.name[0]}</AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: typography.fontWeight.normal, color: colors.text.primary, fontSize: typography.fontSize.lg }}>{msg.name}</p>
                  <p
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {msg.message}
                  </p>
                </div>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                  {msg.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />

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
        {/* Footer icons: Home, Revenue, User (last icon is not clickable) */}
        <button
          key="/coach"
          onClick={() => { globalThis.location.href = '/coach'; }}
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
            color: globalThis.location.pathname === '/coach' ? '#ff3c20' : '#1d1d1f',
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
          <Home style={{ width: 18, height: 18, strokeWidth: 1.5, color: globalThis.location.pathname === '/coach' ? '#ff3c20' : '#1d1d1f' }} />
        </button>
        <button
          key="/revenue"
          onClick={() => { globalThis.location.href = '/revenue'; }}
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
            color: globalThis.location.pathname === '/revenue' ? '#ff3c20' : '#1d1d1f',
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
          <Star style={{ width: 18, height: 18, strokeWidth: 1.5, color: globalThis.location.pathname === '/revenue' ? '#ffb300' : '#1d1d1f' }} />
        </button>
        <button
          key="/testimonials"
          onClick={() => { globalThis.location.href = '/testimonials'; }}
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
            color: globalThis.location.pathname === '/testimonials' ? '#ff3c20' : '#1d1d1f',
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
          <MessageCircle style={{ width: 18, height: 18, strokeWidth: 1.5, color: globalThis.location.pathname === '/testimonials' ? '#ff3c20' : '#1d1d1f' }} />
        </button>
      </div
      >
    </main>
  );
};

export default CoachHome;
