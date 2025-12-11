import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageCircle,
  Share2,
  Edit2,
  Edit3,
  Users,
  TrendingUp,
  Award,
  Video,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

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
  const workoutFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddWorkoutPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setWorkoutPosts([
          {
            id: Date.now(),
            image: ev.target?.result as string,
            likes: 0,
            comments: 0,
            caption: 'New workout photo',
            workout: 'Custom',
          },
          ...workoutPosts,
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = [
    { label: 'Active Clients', value: '48', icon: Users },
    { label: 'Year of Experience', value: '7', unit: 'yrs', icon: Award },
    { label: 'Rating', value: '4.9', unit: '⭐', icon: TrendingUp },
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-orange-500';
      case 'overdue':
        return 'text-red-500';
      case 'received':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

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
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f7 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        paddingBottom: '80px',
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
            background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
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
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  padding: 0,
                }}
                aria-label="Edit profile picture"
              >
                <Edit2 style={{ width: '16px', height: '16px', color: '#ff3c20' }} />
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
                    fontSize: '2.8rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                    background: 'linear-gradient(90deg, #ff3c20 0%, #ff5722 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  John Martinez
                </h1>
                <p style={{ color: '#888', fontSize: '1.2rem' }}>
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
                        borderRadius: '18px',
                        boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
                        padding: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '140px',
                        flex: '1 1 140px',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '0.5px solid rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          padding: '8px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                          opacity: 0.18,
                        }}
                      >
                        <Icon style={{ width: '22px', height: '22px', color: '#ff3c20' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#222' }}>
                          {stat.value}
                          {stat.unit && (
                            <span style={{ fontSize: '1.1rem', marginLeft: '4px' }}>
                              {stat.unit}
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: '0.95rem', color: '#888' }}>{stat.label}</p>
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
      <section className="space-y-6" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>Recent Workouts</h2>
        </div>
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '12px' }}>
          {workoutPosts.length === 0 ? (
            <div style={{ color: '#888', fontSize: '1.1rem', padding: '24px' }}>
              No recent workouts yet.
            </div>
          ) : (
            workoutPosts.map((post, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '260px',
                  background: 'rgba(255,255,255,0.92)',
                  borderRadius: '18px',
                  boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
                  border: '0.5px solid rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: 0,
                }}
              >
                <div
                  style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#eee' }}
                >
                  <img
                    src={post.image}
                    alt={post.caption}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div
                  style={{
                    padding: '16px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: '#222',
                      marginBottom: '8px',
                    }}
                  >
                    {post.caption}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: 'auto',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#ff3c20',
                        fontWeight: 500,
                      }}
                    >
                      <Heart style={{ width: '18px', height: '18px' }} /> {post.likes}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#888',
                        fontWeight: 500,
                      }}
                    >
                      <MessageCircle style={{ width: '18px', height: '18px' }} /> {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <div>
        {/* All main sections: Stats, New Request, Active Clients, Today's Schedule, Payment Tracker, Messages */}

        {/* New Request Section */}
        <section className="space-y-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>New Request</h2>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: '18px',
              boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
              padding: '24px',
              border: '0.5px solid rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Example request, replace with dynamic data as needed */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '18px',
              }}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: '#222',
                    marginBottom: '4px',
                  }}
                >
                  Subscription Request from <span style={{ color: '#ff3c20' }}>Amit Sharma</span>
                </p>
                <p style={{ color: '#888', fontSize: '1rem', marginBottom: '2px' }}>
                  Plan: <span style={{ color: '#ff3c20', fontWeight: 600 }}>Premium Diet Plan</span>
                </p>
                <p style={{ color: '#888', fontSize: '1rem' }}>
                  Payment: <span style={{ color: '#ff3c20', fontWeight: 600 }}>₹1200</span> •
                  Status: <span style={{ color: '#4caf50', fontWeight: 600 }}>Paid</span>
                </p>
              </div>
              <Button
                style={{
                  background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(255,60,32,0.12)',
                }}
              >
                View Details
              </Button>
            </div>
          </div>
        </section>

        {/* Active Clients Section */}
        <section className="space-y-4">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>Active Clients</h2>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '12px' }}>
            {activeClients.map((client) => (
              <button
                key={client.id}
                onClick={() => navigate(`/client/${client.id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '80px',
                  background: 'rgba(255,255,255,0.72)',
                  borderRadius: '14px',
                  boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
                  padding: '12px 10px',
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
                        background: '#ff3c20',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '2px 7px',
                        borderRadius: '8px',
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
                      boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
                      background: 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback>{client.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 500, color: '#222' }}>
                  {client.name}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#ff3c20', fontWeight: 600 }}>Chat</span>
              </button>
            ))}
          </div>
        </section>

        {/* Today's Schedule Section */}
        <section className="space-y-4">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>Today's Schedule</h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: '18px',
              boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
              padding: '18px',
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
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: '8px',
                  boxShadow: '0 1px 4px rgba(255,60,32,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '50%',
                      background: session.type === 'online' ? '#e3f0ff' : '#e3ffe3',
                    }}
                  >
                    {session.type === 'online' ? (
                      <Video style={{ width: '20px', height: '20px', color: '#2196f3' }} />
                    ) : (
                      <MapPin style={{ width: '20px', height: '20px', color: '#4caf50' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, color: '#222', fontSize: '1.1rem' }}>
                      {session.name}
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#888' }}>
                      {session.time} - {session.location}
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    border: `1px solid ${session.status === 'attend' ? '#4caf50' : '#ff3c20'}`,
                    color: session.status === 'attend' ? '#4caf50' : '#ff3c20',
                    borderRadius: '10px',
                    padding: '4px 14px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    background:
                      session.status === 'attend' ? 'rgba(76,175,80,0.08)' : 'rgba(255,60,32,0.06)',
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
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>Payment Tracker</h2>
          <div
            style={{
              background: 'rgba(255,255,255,0.72)',
              borderRadius: '18px',
              boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
              padding: '18px',
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
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: '8px',
                  boxShadow: '0 1px 4px rgba(255,60,32,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar
                    style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.72)' }}
                  >
                    <AvatarImage src={payment.avatar} />
                    <AvatarFallback>{payment.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p style={{ fontWeight: 500, color: '#222', fontSize: '1.1rem' }}>
                      {payment.name}
                    </p>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color:
                          payment.status === 'pending'
                            ? '#ff9800'
                            : payment.status === 'overdue'
                              ? '#f44336'
                              : '#4caf50',
                        fontWeight: 600,
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
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#222' }}>Messages</h2>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#ff3c20',
                fontWeight: 600,
                fontSize: '1rem',
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
              borderRadius: '18px',
              boxShadow: '0 2px 8px rgba(255,60,32,0.08)',
              padding: '18px',
              border: '0.5px solid rgba(0,0,0,0.04)',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.92)',
                  marginBottom: '8px',
                  boxShadow: '0 1px 4px rgba(255,60,32,0.04)',
                }}
              >
                <Avatar
                  style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.72)' }}
                >
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback>{msg.name[0]}</AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 500, color: '#222', fontSize: '1.1rem' }}>{msg.name}</p>
                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: '#888',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {msg.message}
                  </p>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#888', whiteSpace: 'nowrap' }}>
                  {msg.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default CoachHome;
