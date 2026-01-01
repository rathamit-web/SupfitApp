import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Users,
  Zap,
  Footprints,
  Dumbbell,
  Play,
  Waves,
  Flame,
  HeartPulse,
  Moon,
  CreditCard,
  Check,
  UtensilsCrossed,
  Edit3,
  Edit2,
  Home,
  LayoutDashboard,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';




const Index = () => {
  // Show messages sent by coach/dietician to this user (client)
  const [userMessages, setUserMessages] = useState<Array<{ message: string; from: string; date: string }>>([]);
  useEffect(() => {
    // Assume user id is 1 for demo; replace with actual user id if available
    const clientId = 1;
    const allMessages = JSON.parse(localStorage.getItem('userMessages') || '[]');
    const filtered = allMessages.filter((msg: any) => msg.clientId === clientId);
    setUserMessages(filtered);
  }, []);
  // Coach Note for display
  const [coachNote, setCoachNote] = useState<string>(() => localStorage.getItem('coachNote') || '');
  useEffect(() => {
    const handleStorage = () => setCoachNote(localStorage.getItem('coachNote') || '');
    window.addEventListener('focus', handleStorage);
    return () => window.removeEventListener('focus', handleStorage);
  }, []);

  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'today' | 'week'>('today');
  const [profileImage, setProfileImage] = useState<string>(() => {
    const savedImage = localStorage.getItem('profileImage');
    return savedImage || 'https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=400&q=80';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = [
    { label: 'Active Hours', value: '6.5', unit: 'hrs', icon: Zap },
    { label: 'Followers', value: '12.5K', icon: Users },
    { label: 'Rewards', value: '89', unit: '🏆', icon: TrendingUp },
  ];

  const dailyMetrics = [
    {
      label: 'Steps',
      value: '8,500',
      target: '10,000',
      icon: Footprints,
      progress: 85,
      gradient: 'from-blue-400 to-cyan-400',
    },
    {
      label: 'Gym',
      value: '1',
      unit: 'hr',
      icon: Dumbbell,
      completed: true,
      gradient: 'from-purple-400 to-pink-400',
    },
    {
      label: 'Badminton',
      value: '1',
      unit: 'hr',
      icon: Play,
      completed: true,
      gradient: 'from-green-400 to-emerald-400',
    },
    {
      label: 'Swim',
      value: '45',
      unit: 'min',
      icon: Waves,
      completed: true,
      gradient: 'from-cyan-400 to-blue-400',
    },
    {
      label: 'Calories',
      value: '520',
      unit: 'kcal',
      icon: Flame,
      gradient: 'from-orange-400 to-red-400',
    },
    {
      label: 'Avg HR',
      value: '78',
      unit: 'bpm',
      icon: HeartPulse,
      gradient: 'from-rose-400 to-pink-400',
    },
    { label: 'Sleep', value: '7h 20m', icon: Moon, gradient: 'from-indigo-400 to-purple-400' },
  ];

  const [posts, setPosts] = useState(() => {
    const savedPosts = localStorage.getItem('workoutPosts');
    if (savedPosts) {
      return JSON.parse(savedPosts);
    }
    return [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        likes: 234,
        comments: 12,
        caption: 'Morning cardio session 💪 Crushed 10K!',
        workout: 'Running',
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
        likes: 189,
        comments: 8,
        caption: 'Leg day hits different 🔥',
        workout: 'Strength',
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        likes: 312,
        comments: 15,
        caption: 'New PR on deadlifts! 💯',
        workout: 'Powerlifting',
      },
      {
        id: 4,
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
        likes: 276,
        comments: 19,
        caption: 'Yoga flow to end the week 🧘',
        workout: 'Yoga',
      },
    ];
  });

  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editWorkout, setEditWorkout] = useState('');
  const workoutFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  // State for showing likes and comments modals
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);

  const handleWorkoutImageChange = (postId: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPosts = posts.map((post) =>
        post.id === postId ? { ...post, image: reader.result as string } : post,
      );
      setPosts(updatedPosts);
      localStorage.setItem('workoutPosts', JSON.stringify(updatedPosts));
    };
    reader.readAsDataURL(file);
  };

  const handleEditPost = (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      setEditingPost(postId);
      setEditCaption(post.caption);
      setEditWorkout(post.workout);
    }
  };

  const handleSaveEdit = () => {
    if (editingPost !== null) {
      const updatedPosts = posts.map((post) =>
        post.id === editingPost ? { ...post, caption: editCaption, workout: editWorkout } : post,
      );
      setPosts(updatedPosts);
      localStorage.setItem('workoutPosts', JSON.stringify(updatedPosts));
      setEditingPost(null);
    }
  };

  // topFollowers removed (unused)

  const loadSubscriptionsFromStorage = () => {
    const gymSubscription = localStorage.getItem('gymSubscription');
    const coachSubscription = localStorage.getItem('coachSubscription');
    const dieticianSubscription = localStorage.getItem('dieticianSubscription');

    const defaultSubscriptions = [
      {
        id: 1,
        type: 'My Gym',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        icon: Dumbbell,
        gradient: 'from-purple-400 to-pink-400',
        validUpto: null as string | null,
        packageName: null as string | null,
      },
      {
        id: 2,
        type: 'Gym Coach',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        icon: Users,
        gradient: 'from-blue-400 to-cyan-400',
        validUpto: null as string | null,
        packageName: null as string | null,
      },
      {
        id: 3,
        type: 'Dietician',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        icon: UtensilsCrossed,
        gradient: 'from-green-400 to-emerald-400',
        validUpto: null as string | null,
        packageName: null as string | null,
      },
    ];

    if (gymSubscription) {
      const gym = JSON.parse(gymSubscription);
      defaultSubscriptions[0] = {
        id: 1,
        type: 'My Gym',
        name: gym.name,
        status: gym.status,
        amount: `₹${gym.amount.toLocaleString()}`,
        icon: Dumbbell,
        gradient: 'from-purple-400 to-pink-400',
        validUpto: gym.validUpto,
        packageName: gym.packageName,
      };
    }

    if (coachSubscription) {
      const coach = JSON.parse(coachSubscription);
      defaultSubscriptions[1] = {
        id: 2,
        type: 'Gym Coach',
        name: coach.name,
        status: coach.status,
        amount: `₹${coach.amount.toLocaleString()}`,
        icon: Users,
        gradient: 'from-blue-400 to-cyan-400',
        validUpto: coach.validUpto,
        packageName: coach.packageName,
      };
    }

    if (dieticianSubscription) {
      const dietician = JSON.parse(dieticianSubscription);
      defaultSubscriptions[2] = {
        id: 3,
        type: 'Dietician',
        name: dietician.name,
        status: dietician.status,
        amount: `₹${dietician.amount.toLocaleString()}`,
        icon: UtensilsCrossed,
        gradient: 'from-green-400 to-emerald-400',
        validUpto: dietician.validUpto,
        packageName: dietician.packageName,
      };
    }

    return defaultSubscriptions;
  };

  const [subscriptions, setSubscriptions] = useState(() => loadSubscriptionsFromStorage());

  useEffect(() => {
    // Reload subscriptions when window gains focus (user returns from navigation)
    const handleFocus = () => {
      setSubscriptions(loadSubscriptionsFromStorage());
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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

  const dietPlan = {
    breakfast: {
      main: 'Oatmeal with berries and almonds',
      alternates: [
        'Greek yogurt with granola and honey',
        'Whole wheat toast with avocado and eggs',
        'Protein smoothie with banana and spinach',
      ],
    },
    lunch: {
      main: 'Grilled chicken with quinoa and vegetables',
      alternates: [
        'Salmon with brown rice and broccoli',
        'Turkey wrap with mixed greens',
        'Lentil soup with whole grain bread',
      ],
    },
    dinner: {
      main: 'Lean beef with sweet potato and asparagus',
      alternates: [
        'Grilled fish with roasted vegetables',
        'Chicken stir-fry with brown rice',
        'Vegetable curry with chickpeas',
      ],
    },
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f5f5f7 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Roboto", "Google Sans", "Helvetica Neue", Arial, sans-serif',
        paddingBottom: '80px',
        letterSpacing: '-0.24px',
      }}
    >
      {/* Hero Profile Section */}
      <header
        style={{
          padding: '40px 20px 20px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Info with Settings */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flex: '1',
                minWidth: '280px',
              }}
            >
              {/* Profile Image with Edit Button */}
              <div
                style={{
                  position: 'relative',
                  width: '100px',
                  height: '100px',
                  flexShrink: 0,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfileImage(reader.result as string);
                        localStorage.setItem('profileImage', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Avatar
                  style={{
                    width: '100px',
                    height: '100px',
                    border: '4px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    cursor: 'pointer',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <AvatarImage
                    src={profileImage}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                  <AvatarFallback>FT</AvatarFallback>
                </Avatar>
                {/* Edit Button Overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 60, 32, 0.95)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) (icon as SVGElement).style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.transform = 'scale(1)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) (icon as SVGElement).style.color = '#1d1d1f';
                  }}
                  aria-label="Edit profile picture"
                >
                  <Edit2
                    style={{
                      width: '14px',
                      height: '14px',
                      color: '#1d1d1f',
                      transition: 'color 0.2s ease',
                    }}
                  />
                </button>
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(32px, 6vw, 52px)',
                    fontWeight: '800',
                    letterSpacing: '-1.2px',
                    color: '#1d1d1f',
                    marginBottom: '8px',
                    lineHeight: '1.1',
                    background: 'linear-gradient(135deg, #1d1d1f 0%, #ff3c20 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Fitness Titan
                </h1>
                <p
                  style={{
                    fontSize: 'clamp(15px, 2.2vw, 18px)',
                    color: '#6e6e73',
                    fontWeight: '500',
                    lineHeight: '1.5',
                    letterSpacing: '-0.2px',
                  }}
                >
                  Athlete • Fitness Coach • Marathon Runner
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              maxWidth: '100%',
            }}
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '18px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(255, 60, 32, 0.12), rgba(255, 60, 32, 0.06))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ width: '24px', height: '24px', color: '#ff3c20', strokeWidth: 2.5 }} />
                  </div>
                  <p
                    style={{
                      fontSize: '34px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      letterSpacing: '-0.5px',
                      marginBottom: '0',
                    }}
                  >
                    {stat.value}
                    {stat.unit && (
                      <span style={{ fontSize: '16px', color: '#6e6e73', fontWeight: '500' }}>{stat.unit}</span>
                    )}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6e6e73', fontWeight: '500', letterSpacing: '-0.2px', marginTop: '2px' }}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Coach Note Display */}
      {coachNote && (
        <section
          style={{
            margin: '0 auto 32px',
            maxWidth: '700px',
            background: 'linear-gradient(135deg, #fff7f5 60%, #fff)',
            borderRadius: '18px',
            boxShadow: '0 2px 12px rgba(255,60,32,0.07)',
            border: '1px solid #ffe5e0',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <h3 style={{ color: '#ff3c20', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Coach's Note</h3>
          <div style={{ color: '#1d1d1f', fontSize: '16px', fontStyle: 'italic' }}>{coachNote}</div>
        </section>
      )}

      {/* Messages from Coach/Dietician */}
      {userMessages.length > 0 && (
        <section
          style={{
            margin: '0 auto 32px',
            maxWidth: '700px',
            background: 'linear-gradient(135deg, #f5faff 60%, #fff)',
            borderRadius: '18px',
            boxShadow: '0 2px 12px rgba(32,120,255,0.07)',
            border: '1px solid #e0f0ff',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <h3 style={{ color: '#2078ff', fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Messages from Coach/Dietician</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userMessages.map((msg, idx) => (
              <div key={idx} style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 4px rgba(32,120,255,0.04)',
                border: '1px solid #e0f0ff',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ fontSize: '15px', color: '#1d1d1f', fontWeight: 500 }}>{msg.message}</div>
                <div style={{ fontSize: '12px', color: '#6e6e73', fontStyle: 'italic' }}>
                  {msg.from === 'coach' ? 'Coach' : 'Dietician'} • {new Date(msg.date).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: '24px',
          }}
        >
          {/* Posts Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  letterSpacing: '-0.6px',
                  color: '#1d1d1f',
                  marginTop: '8px',
                }}
              >
                Recent Workouts
              </h2>
              <span
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 60, 32, 0.1)',
                  color: '#ff3c20',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                This Week: 8 workouts
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '16px',
              }}
            >
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={(el) => {
                        if (el) workoutFileInputRefs.current[post.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleWorkoutImageChange(post.id, file);
                        }
                      }}
                    />
                    <button
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        height: '240px',
                        cursor: 'pointer',
                        display: 'block',
                      }}
                      onClick={() => workoutFileInputRefs.current[post.id]?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          workoutFileInputRefs.current[post.id]?.click();
                        }
                      }}
                      tabIndex={0}
                      aria-label="Change workout image"
                    >
                      <img
                        src={post.image}
                        alt={post.caption}
                        style={{
                          width: '100%',
                          height: '240px',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block',
                        }}
                        draggable={false}
                      />
                    </button>
                    {/* Edit Image Button */}
                    <button
                      onClick={(e) => {
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
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        padding: 0,
                        zIndex: 2,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 32, 0.95)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                        const icon = e.currentTarget.querySelector('svg');
                        if (icon) (icon as SVGElement).style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                        e.currentTarget.style.transform = 'scale(1)';
                        const icon = e.currentTarget.querySelector('svg');
                        if (icon) (icon as SVGElement).style.color = '#1d1d1f';
                      }}
                      aria-label="Edit workout image"
                    >
                      <Edit2
                        style={{
                          width: '16px',
                          height: '16px',
                          color: '#1d1d1f',
                          transition: 'color 0.2s ease',
                        }}
                      />
                    </button>
                    <span
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#ff3c20',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {post.workout}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <p
                        style={{
                          fontWeight: '600',
                          fontSize: '15px',
                          color: '#1d1d1f',
                          lineHeight: '1.4',
                          flex: 1,
                        }}
                      >
                        {post.caption}
                      </p>
                      <button
                        onClick={() => handleEditPost(post.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          padding: 0,
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 60, 32, 0.95)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) (icon as SVGElement).style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                          e.currentTarget.style.transform = 'scale(1)';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) (icon as SVGElement).style.color = '#1d1d1f';
                        }}
                        aria-label="Edit caption and workout"
                      >
                        <Edit3
                          style={{
                            width: '14px',
                            height: '14px',
                            color: '#1d1d1f',
                            transition: 'color 0.2s ease',
                          }}
                        />
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        color: '#6e6e73',
                        fontSize: '14px',
                        marginTop: 'auto',
                      }}
                    >
                      <button
                        onClick={() => setShowLikesModal(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6e6e73',
                          fontSize: '14px',
                          padding: 0,
                          fontFamily: 'inherit',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff3c20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6e6e73';
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
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6e6e73',
                          fontSize: '14px',
                          padding: 0,
                          fontFamily: 'inherit',
                          transition: 'color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ff3c20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6e6e73';
                        }}
                      >
                        <MessageCircle style={{ width: '16px', height: '16px' }} />
                        {post.comments}
                      </button>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
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

          {/* Daily Metrics Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Daily Dashboard Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      letterSpacing: '-0.3px',
                      color: '#1d1d1f',
                    }}
                  >
                    Daily Metrics
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <button
                      onClick={() => setActiveView('today')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeView === 'today' ? '#ff3c20' : 'transparent',
                        color: activeView === 'today' ? '#ffffff' : '#6e6e73',
                        transition: 'all 0.2s',
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setActiveView('week')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        background: activeView === 'week' ? '#ff3c20' : 'transparent',
                        color: activeView === 'week' ? '#ffffff' : '#6e6e73',
                        transition: 'all 0.2s',
                      }}
                    >
                      Week
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dailyMetrics.map((metric) => {
                    const Icon = metric.icon;
                    const gradientMap: { [key: string]: string } = {
                      'from-blue-400 to-cyan-400': 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                      'from-purple-400 to-pink-400': 'linear-gradient(135deg, #c084fc, #f472b6)',
                      'from-green-400 to-emerald-400': 'linear-gradient(135deg, #4ade80, #34d399)',
                      'from-cyan-400 to-blue-400': 'linear-gradient(135deg, #22d3ee, #60a5fa)',
                      'from-orange-400 to-red-400': 'linear-gradient(135deg, #fb923c, #f87171)',
                      'from-rose-400 to-pink-400': 'linear-gradient(135deg, #fb7185, #f472b6)',
                      'from-indigo-400 to-purple-400': 'linear-gradient(135deg, #818cf8, #c084fc)',
                    };
                    return (
                      <div
                        key={metric.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.5)',
                          border: '1px solid rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              background: gradientMap[metric.gradient] || metric.gradient,
                              padding: '10px',
                              borderRadius: '12px',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <Icon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1d1d1f',
                              }}
                            >
                              {metric.label}
                            </p>
                            {metric.target && (
                              <div
                                style={{
                                  width: '120px',
                                  height: '4px',
                                  background: 'rgba(0, 0, 0, 0.1)',
                                  borderRadius: '2px',
                                  marginTop: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    background: '#ff3c20',
                                    borderRadius: '2px',
                                    width: `${metric.progress}%`,
                                    transition: 'width 0.3s',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              fontSize: '17px',
                              fontWeight: '700',
                              color: '#1d1d1f',
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '4px',
                            }}
                          >
                            {metric.value}
                            {metric.unit && (
                              <span
                                style={{ fontSize: '13px', fontWeight: '500', color: '#6e6e73' }}
                              >
                                {metric.unit}
                              </span>
                            )}
                          </p>
                          {metric.target && (
                            <p style={{ fontSize: '12px', color: '#6e6e73' }}>/ {metric.target}</p>
                          )}
                          {metric.completed && (
                            <span style={{ fontSize: '12px', color: '#34c759' }}>✓ Done</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Subscription Section */}
        <section
          style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: '#1d1d1f',
            }}
          >
            My Subscriptions
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '16px',
            }}
          >
            {subscriptions.map((sub) => {
              const Icon = sub.icon;
              const gradientMap: { [key: string]: string } = {
                'from-purple-400 to-pink-400': 'linear-gradient(135deg, #c084fc, #f472b6)',
                'from-blue-400 to-cyan-400': 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                'from-green-400 to-emerald-400': 'linear-gradient(135deg, #4ade80, #34d399)',
              };
              return (
                <div
                  key={sub.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '20px',
                    padding: '24px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          background: gradientMap[sub.gradient] || sub.gradient,
                          padding: '12px',
                          borderRadius: '14px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6e6e73', fontWeight: '500' }}>
                          {sub.type}
                        </p>
                        <p style={{ fontSize: '17px', fontWeight: '700', color: '#1d1d1f' }}>
                          {sub.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (sub.type === 'My Gym') navigate('/select-gym');
                        else if (sub.type === 'Gym Coach') navigate('/select-coach');
                        else if (sub.type === 'Dietician') navigate('/select-dietician');
                      }}
                      style={{
                        background: 'rgba(255, 60, 32, 0.1)',
                        border: '1px solid rgba(255, 60, 32, 0.2)',
                        borderRadius: '10px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 32, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 60, 32, 0.1)';
                      }}
                      aria-label={`Edit ${sub.type}`}
                    >
                      <Edit3 style={{ width: '18px', height: '18px', color: '#ff3c20' }} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#1d1d1f',
                        }}
                      >
                        {sub.amount}
                      </span>
                      {sub.validUpto && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: new Date(sub.validUpto) > new Date() ? '#34c759' : '#ff3c20',
                          }}
                        >
                          Valid upto:{' '}
                          {new Date(sub.validUpto).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      {sub.packageName && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6e6e73',
                          }}
                        >
                          {sub.packageName}
                        </span>
                      )}
                    </div>
                    {sub.status === 'paid' ? (
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            background: 'rgba(52, 199, 89, 0.1)',
                            border: '1px solid rgba(52, 199, 89, 0.3)',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Check style={{ width: '16px', height: '16px', color: '#34c759' }} />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#34c759' }}>
                            Paid
                          </span>
                        </div>
                        {/* Feedback Button for paid subscriptions */}
                        <Button
                          onClick={() => navigate('/feedback')}
                          style={{
                            background: '#ff3c20',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '14px',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(255, 60, 32, 0.3)',
                          }}
                        >
                          <MessageCircle style={{ width: '16px', height: '16px' }} />
                          Feedback
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          if (sub.type === 'My Gym') navigate('/select-gym');
                          else if (sub.type === 'Gym Coach') navigate('/select-coach');
                          else if (sub.type === 'Dietician') navigate('/select-dietician');
                        }}
                        style={{
                          background: '#ff3c20',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '14px',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(255, 60, 32, 0.3)',
                          alignSelf: 'flex-start',
                        }}
                      >
                        <CreditCard style={{ width: '16px', height: '16px' }} />
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Diet Recommendation Section */}
        <section
          style={{
            marginTop: '48px',
            paddingBottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: '#1d1d1f',
            }}
          >
            My Diet Recommendation
          </h2>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                gap: '20px',
              }}
            >
              {/* Breakfast */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                      padding: '10px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(251, 146, 60, 0.3)',
                    }}
                  >
                    <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                    }}
                  >
                    Breakfast
                  </h3>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#1d1d1f',
                      lineHeight: '1.5',
                    }}
                  >
                    {dietPlan.breakfast.main}
                  </p>
                </div>
              </div>

              {/* Lunch */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                      padding: '10px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)',
                    }}
                  >
                    <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                    }}
                  >
                    Lunch
                  </h3>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#1d1d1f',
                      lineHeight: '1.5',
                    }}
                  >
                    {dietPlan.lunch.main}
                  </p>
                </div>
              </div>

              {/* Dinner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                      padding: '10px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(192, 132, 252, 0.3)',
                    }}
                  >
                    <UtensilsCrossed style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                  </div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: '700',
                      color: '#1d1d1f',
                    }}
                  >
                    Dinner
                  </h3>
                </div>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#1d1d1f',
                      lineHeight: '1.5',
                    }}
                  >
                    {dietPlan.dinner.main}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    style={{
                      background: '#ff3c20',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '15px',
                      padding: '12px 32px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 60, 32, 0.3)',
                    }}
                  >
                    View All Details
                  </Button>
                </DialogTrigger>
                <DialogContent
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '20px',
                    maxWidth: '700px',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                  }}
                >
                  <DialogHeader>
                    <DialogTitle
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        letterSpacing: '-0.5px',
                        color: '#1d1d1f',
                      }}
                    >
                      Complete Diet Plan
                    </DialogTitle>
                  </DialogHeader>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                      marginTop: '24px',
                    }}
                  >
                    {/* Breakfast Alternates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                            padding: '10px',
                            borderRadius: '12px',
                          }}
                        >
                          <UtensilsCrossed
                            style={{ width: '20px', height: '20px', color: '#ffffff' }}
                          />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>
                          Breakfast Options
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 60, 32, 0.1)',
                            borderLeft: '4px solid #ff3c20',
                          }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#ff3c20' }}>
                            Recommended
                          </p>
                          <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                            {dietPlan.breakfast.main}
                          </p>
                        </div>
                        {dietPlan.breakfast.alternates.map((alt, idx) => (
                          <div
                            key={alt}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              background: 'rgba(0, 0, 0, 0.03)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                              Alternate {idx + 1}
                            </p>
                            <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                              {alt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lunch Alternates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #60a5fa, #22d3ee)',
                            padding: '10px',
                            borderRadius: '12px',
                          }}
                        >
                          <UtensilsCrossed
                            style={{ width: '20px', height: '20px', color: '#ffffff' }}
                          />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>
                          Lunch Options
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 60, 32, 0.1)',
                            borderLeft: '4px solid #ff3c20',
                          }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#ff3c20' }}>
                            Recommended
                          </p>
                          <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                            {dietPlan.lunch.main}
                          </p>
                        </div>
                        {dietPlan.lunch.alternates.map((alt, idx) => (
                          <div
                            key={alt}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              background: 'rgba(0, 0, 0, 0.03)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                              Alternate {idx + 1}
                            </p>
                            <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                              {alt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dinner Alternates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #c084fc, #f472b6)',
                            padding: '10px',
                            borderRadius: '12px',
                          }}
                        >
                          <UtensilsCrossed
                            style={{ width: '20px', height: '20px', color: '#ffffff' }}
                          />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1d1d1f' }}>
                          Dinner Options
                        </h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 60, 32, 0.1)',
                            borderLeft: '4px solid #ff3c20',
                          }}
                        >
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#ff3c20' }}>
                            Recommended
                          </p>
                          <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                            {dietPlan.dinner.main}
                          </p>
                        </div>
                        {dietPlan.dinner.alternates.map((alt, idx) => (
                          <div
                            key={alt}
                            style={{
                              padding: '16px',
                              borderRadius: '12px',
                              background: 'rgba(0, 0, 0, 0.03)',
                              border: '1px solid rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                              Alternate {idx + 1}
                            </p>
                            <p style={{ fontSize: '14px', color: '#1d1d1f', marginTop: '4px' }}>
                              {alt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </div>
      <Footer />

      {/* Edit Workout Post Dialog */}
      <Dialog open={editingPost !== null} onOpenChange={() => setEditingPost(null)}>
        <DialogContent
          style={{
            maxWidth: '500px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            padding: '32px',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Edit Workout Post
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
            {/* Workout Type Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="workout-type"
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                }}
              >
                Workout Type
              </label>
              <Input
                id="workout-type"
                value={editWorkout}
                onChange={(e) => setEditWorkout(e.target.value)}
                placeholder="e.g., Running, Strength, Yoga"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '15px',
                  background: 'rgba(255, 255, 255, 0.9)',
                }}
              />
            </div>

            {/* Caption Textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="caption"
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                }}
              >
                Caption
              </label>
              <Textarea
                id="caption"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Write your caption here..."
                rows={4}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '15px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  resize: 'vertical',
                  minHeight: '100px',
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button
              onClick={() => setEditingPost(null)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                color: '#1d1d1f',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#ff3c20',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 60, 32, 0.3)',
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Likes Modal */}
      <Dialog open={showLikesModal !== null} onOpenChange={() => setShowLikesModal(null)}>
        <DialogContent
          style={{
            maxWidth: '500px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Likes
            </DialogTitle>
            <DialogClose style={{ display: 'none' }} />
            <button
              onClick={() => setShowLikesModal(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                position: 'absolute',
                top: '20px',
                right: '20px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <span style={{ fontSize: '24px', color: '#6e6e73' }}>×</span>
            </button>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {showLikesModal && postLikes[showLikesModal]?.map((like) => (
              <div
                key={like.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
              >
                <Avatar style={{ width: '40px', height: '40px' }}>
                  <AvatarImage src={like.avatar} />
                  <AvatarFallback>{like.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1d1d1f' }}>
                    {like.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                    {like.time}
                  </p>
                </div>
                <Heart style={{ width: '16px', height: '16px', color: '#ff3c20', fill: '#ff3c20' }} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showCommentsModal !== null} onOpenChange={() => setShowCommentsModal(null)}>
        <DialogContent
          style={{
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            padding: '32px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1d1d1f',
                marginBottom: '8px',
              }}
            >
              Comments
            </DialogTitle>
            <DialogClose style={{ display: 'none' }} />
            <button
              onClick={() => setShowCommentsModal(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                position: 'absolute',
                top: '20px',
                right: '20px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <span style={{ fontSize: '24px', color: '#6e6e73' }}>×</span>
            </button>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {showCommentsModal && postComments[showCommentsModal]?.map((comment) => (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
              >
                <Avatar style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                  <AvatarImage src={comment.avatar} />
                  <AvatarFallback>{comment.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>
                      {comment.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6e6e73' }}>
                      {comment.time}
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', color: '#1d1d1f', lineHeight: '1.4' }}>
                    {comment.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
              <item.icon style={{ width: '18px', height: '18px', strokeWidth: 1.5 }} />
            </button>
          );
        })}
      </div>
    </main>
  );
};

export default Index;
