import CoachFooter from '@/components/CoachFooter';
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
  User,
  LayoutDashboard
} from 'lucide-react';

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  // State for showing likes and comments modals
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);

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

  // Mock data for likes and comments
  const postLikes: { [key: number]: Array<{ id: number; name: string; avatar: string; time: string }> } = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '2h ago' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', time: '5h ago' },
      { id: 3, name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', time: '1d ago' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', time: '1h ago' },
      { id: 2, name: 'Lisa Brown', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '3h ago' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', time: '30m ago' },
      { id: 2, name: 'Anna Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', time: '2h ago' },
      { id: 3, name: 'Tom Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', time: '4h ago' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '1h ago' },
      { id: 2, name: 'Chris Martin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', time: '6h ago' },
    ],
  };

  const postComments: { [key: number]: Array<{ id: number; name: string; avatar: string; message: string; time: string }> } = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Amazing workout! Keep it up! 💪', time: '2h ago' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', message: 'This is so inspiring! Can you share the routine?', time: '5h ago' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', message: 'Great form! 🔥', time: '1h ago' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', message: 'Incredible transformation! How long did this take?', time: '30m ago' },
      { id: 2, name: 'Anna Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', message: 'You\'re such an inspiration! 🙌', time: '2h ago' },
      { id: 3, name: 'Tom Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', message: 'Would love to train with you!', time: '4h ago' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Perfect yoga session! 🧘', time: '1h ago' },
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
              
              {/* Name and Title Section */}
              <div>
                <h1
                  style={{
                    fontSize: typography.fontSize['4xl'],
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
              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '18px', marginTop: spacing[16] }}>
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
                        flex: '1',
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
                          background: colors.primary,
                          boxShadow: shadows.xs,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon style={{ width: '22px', height: '22px', color: '#ffffff', strokeWidth: 2 }} />
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
        </div>
      </header>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1400px' }}>
        {/* Recent Workouts Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: spacing[24], marginBottom: spacing[32] }}>
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
          } }
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = shadows.lg;
          } }
        >
          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={el => {
                if (el) workoutFileInputRefs.current[post.id] = el;
              } }
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const updated = workoutPosts.map(p => p.id === post.id ? { ...p, image: typeof reader.result === 'string' ? reader.result : p.image } : p
                    );
                    setWorkoutPosts(updated);
                  };
                  reader.readAsDataURL(file);
                }
              } } />
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
              onClick={() => workoutFileInputRefs.current[post.id]?.click()} />
            {/* Edit Image Button */}
            <button
              onClick={e => {
                e.stopPropagation();
                workoutFileInputRefs.current[post.id]?.click();
              } }
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
              } }
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'scale(1)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.color = colors.text.primary;
              } }
              aria-label="Edit workout image"
            >
              <Edit2
                style={{
                  width: '16px',
                  height: '16px',
                  color: colors.text.primary,
                  transition: transitions.fast,
                }} />
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
              <button
                onClick={() => setShowLikesModal(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[4],
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
              >
                <Heart style={{ width: '16px', height: '16px' }} />
                {post.likes}
              </button>
              <button
                onClick={() => setShowCommentsModal(post.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[4],
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
              >
                <MessageCircle style={{ width: '16px', height: '16px' }} />
                {post.comments}
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[4],
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                  padding: 0,
                  fontFamily: 'inherit',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
              >
                <Share2 style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
        </section>

        {/* New Request Section */}
        <section className="space-y-6" style={{ marginBottom: spacing[32] }}>
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
        <section className="space-y-4" style={{ marginBottom: spacing[32] }}>
        <h2 style={{ fontSize: typography.fontSize['4xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>Active Clients</h2>
        <div 
          style={{ 
            display: 'flex', 
            gap: spacing[24], 
            overflowX: 'auto', 
            paddingBottom: spacing[12],
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
            WebkitOverflowScrolling: 'touch', /* Smooth scrolling on iOS */
          }}
          className="hide-scrollbar"
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
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
                transition: transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = shadows.sm;
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
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colors.text.primary }}>
                {client.name}
              </span>
            </button>
          ))}
        </div>
        </section>

        {/* Today's Schedule Section */}
        <section className="space-y-4" style={{ marginBottom: spacing[32] }}>
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
                  background: session.status === 'attend' ? 'rgba(52,199,89,0.08)' : `rgba(${Number.parseInt(colors.primary.substring(1, 3), 16)}, ${Number.parseInt(colors.primary.substring(3, 5), 16)}, ${Number.parseInt(colors.primary.substring(5, 7), 16)}, 0.06)`,
                }}
              >
                {session.status === 'attend' ? '✓ Attend' : '✗ Absent'}
              </span>
            </div>
          ))}
        </div>
        </section>

        {/* Payment Tracker Section */}
        <section className="space-y-4" style={{ marginBottom: spacing[32] }}>
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
                      color: payment.status === 'pending'
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
        <section className="space-y-4" style={{ marginBottom: spacing[32] }}>
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

      {/* Likes Modal */}
      {showLikesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: spacing[16],
          }}
          onClick={() => setShowLikesModal(null)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.xl,
              maxWidth: '500px',
              width: '100%',
              maxHeight: '600px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: spacing[20],
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Likes
              </h3>
              <button
                onClick={() => setShowLikesModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing[8],
                  borderRadius: borderRadius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={{ fontSize: '24px', color: colors.text.secondary }}>×</span>
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: spacing[16],
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {postLikes[showLikesModal]?.map((like) => (
                <div
                  key={like.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[12],
                    padding: spacing[12],
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing[8],
                    transition: transitions.fast,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Avatar style={{ width: '48px', height: '48px' }}>
                    <AvatarImage src={like.avatar} />
                    <AvatarFallback>{like.name[0]}</AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        fontSize: typography.fontSize.base,
                        margin: 0,
                      }}
                    >
                      {like.name}
                    </p>
                    <p
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.secondary,
                        margin: 0,
                      }}
                    >
                      {like.time}
                    </p>
                  </div>
                  <Heart
                    style={{
                      width: '20px',
                      height: '20px',
                      color: colors.primary,
                      fill: colors.primary,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: spacing[16],
          }}
          onClick={() => setShowCommentsModal(null)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: borderRadius['2xl'],
              boxShadow: shadows.xl,
              maxWidth: '600px',
              width: '100%',
              maxHeight: '700px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: spacing[20],
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Comments
              </h3>
              <button
                onClick={() => setShowCommentsModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing[8],
                  borderRadius: borderRadius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                <span style={{ fontSize: '24px', color: colors.text.secondary }}>×</span>
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                padding: spacing[16],
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {postComments[showCommentsModal]?.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    display: 'flex',
                    gap: spacing[12],
                    padding: spacing[12],
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing[12],
                    transition: transitions.fast,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Avatar style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback>{comment.name[0]}</AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: borderRadius.lg,
                        padding: spacing[12],
                        marginBottom: spacing[4],
                      }}
                    >
                      <p
                        style={{
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary,
                          fontSize: typography.fontSize.sm,
                          margin: 0,
                          marginBottom: spacing[4],
                        }}
                      >
                        {comment.name}
                      </p>
                      <p
                        style={{
                          fontSize: typography.fontSize.base,
                          color: colors.text.primary,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {comment.message}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.secondary,
                        margin: 0,
                        paddingLeft: spacing[12],
                      }}
                    >
                      {comment.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
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
        <button
          onClick={() => { globalThis.location.href = '/coach-home'; }}
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
            color: globalThis.location.pathname === '/coach-home' ? '#ff3c20' : '#1d1d1f',
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
          <Home style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
        </button>
        <button
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
          <LayoutDashboard style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
        </button>
        <button
          onClick={() => { globalThis.location.href = '/client/1'; }}
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
            color: globalThis.location.pathname.startsWith('/client/') ? '#ff3c20' : '#1d1d1f',
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
          <LayoutDashboard style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
        </button>
        <button
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
          <MessageCircle style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
        </button>
      </div>
      <CoachFooter />
    </main>
  );
};

export default CoachHome;
