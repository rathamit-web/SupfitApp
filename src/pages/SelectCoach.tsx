import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageCircle,
  Check,
  Users,
  Award,
  Calendar,
  IndianRupee,
  Video,
  MapPinned,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Footer from '@/components/Footer';

interface CoachPackage {
  id: number;
  name: string;
  duration: string;
  monthlyPrice: number;
  yearlyPrice: number;
  sessions: number;
  features: string[];
}

interface Coach {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
  clients: number;
  image: string;
  location: string;
  mode: string[];
  certifications: string[];
  packages: CoachPackage[];
  bio: string;
}

const SelectCoach = () => {
  const navigate = useNavigate();
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'online' | 'offline'>('all');
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const coaches: Coach[] = [
    {
      id: 1,
      name: 'John Martinez',
      specialty: 'Strength & Conditioning',
      experience: '8 years',
      rating: 4.9,
      reviews: 156,
      clients: 48,
      image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80',
      location: 'Sector 18, Noida',
      mode: ['Online', 'Offline'],
      certifications: ['ACE Certified', 'NASM CPT', 'Sports Nutrition'],
      bio: 'Specialized in strength training and body transformation. Helped 200+ clients achieve their fitness goals.',
      packages: [
        {
          id: 1,
          name: 'Starter Pack',
          duration: '1 Month',
          monthlyPrice: 4999,
          yearlyPrice: 49999,
          sessions: 12,
          features: ['12 Training Sessions', 'Workout Plan', 'WhatsApp Support'],
        },
        {
          id: 2,
          name: 'Pro Pack',
          duration: '3 Months',
          monthlyPrice: 12999,
          yearlyPrice: 129999,
          sessions: 36,
          features: [
            '36 Training Sessions',
            'Customized Workout Plan',
            'Diet Plan',
            '24/7 Support',
            'Progress Tracking',
          ],
        },
        {
          id: 3,
          name: 'Elite Pack',
          duration: '6 Months',
          monthlyPrice: 22999,
          yearlyPrice: 229999,
          sessions: 72,
          features: [
            '72 Training Sessions',
            'Personalized Plans',
            'Nutrition Counseling',
            '24/7 Priority Support',
            'Body Composition Analysis',
            'Supplement Guide',
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Sarah Chen',
      specialty: 'Yoga & Wellness',
      experience: '6 years',
      rating: 5.0,
      reviews: 203,
      clients: 65,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      location: 'Online Only',
      mode: ['Online'],
      certifications: ['RYT 500', 'Wellness Coach', 'Meditation Instructor'],
      bio: 'Helping people find balance through yoga, meditation, and holistic wellness practices.',
      packages: [
        {
          id: 1,
          name: 'Basic Wellness',
          duration: '1 Month',
          monthlyPrice: 2999,
          yearlyPrice: 29999,
          sessions: 8,
          features: ['8 Online Sessions', 'Yoga Flow Videos', 'Meditation Guide'],
        },
        {
          id: 2,
          name: 'Complete Wellness',
          duration: '3 Months',
          monthlyPrice: 7999,
          yearlyPrice: 79999,
          sessions: 24,
          features: [
            '24 Online Sessions',
            'Personalized Yoga Plan',
            'Meditation Sessions',
            'Stress Management',
            'Monthly Wellness Check-in',
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Rajesh Kumar',
      specialty: 'Weight Loss & Cardio',
      experience: '10 years',
      rating: 4.8,
      reviews: 289,
      clients: 92,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      location: 'Sector 62, Noida',
      mode: ['Online', 'Offline'],
      certifications: ['ISSA Certified', 'Weight Management Specialist', 'CrossFit Level 2'],
      bio: 'Expert in fat loss and cardiovascular fitness. Transformed 500+ lives with sustainable fitness programs.',
      packages: [
        {
          id: 1,
          name: 'Fat Loss Starter',
          duration: '2 Months',
          monthlyPrice: 8999,
          yearlyPrice: 89999,
          sessions: 24,
          features: ['24 Training Sessions', 'Fat Loss Plan', 'Cardio Program', 'Diet Guidance'],
        },
        {
          id: 2,
          name: 'Transformation Pack',
          duration: '6 Months',
          monthlyPrice: 24999,
          yearlyPrice: 249999,
          sessions: 72,
          features: [
            '72 Training Sessions',
            'Complete Transformation Plan',
            'Nutrition Coaching',
            'Weekly Progress Reviews',
            'Before/After Photos',
            'Lifestyle Coaching',
          ],
        },
      ],
    },
  ];

  const filteredCoaches =
    viewMode === 'all'
      ? coaches
      : coaches.filter((coach) =>
          viewMode === 'online' ? coach.mode.includes('Online') : coach.mode.includes('Offline'),
        );

  const handleSelectCoach = (coachId: number) => {
    setSelectedCoach(coachId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = () => {
    if (!selectedCoach || !selectedPackage) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const coach = filteredCoaches.find((c) => c.id === selectedCoach);
      const pkg = coach?.packages.find((p) => p.id === selectedPackage);

      if (coach && pkg) {
        const amount = subscriptionType === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice;
        const validFrom = new Date();
        const validUpto = new Date();

        if (subscriptionType === 'monthly') {
          validUpto.setMonth(validUpto.getMonth() + 1);
        } else {
          validUpto.setFullYear(validUpto.getFullYear() + 1);
        }

        const subscription = {
          id: selectedCoach,
          type: 'Gym Coach',
          name: coach.name,
          status: 'paid',
          amount: amount,
          validFrom: validFrom.toISOString(),
          validUpto: validUpto.toISOString(),
          subscriptionType: subscriptionType,
          packageName: pkg.name,
        };

        localStorage.setItem('coachSubscription', JSON.stringify(subscription));
      }

      setIsProcessing(false);
      setShowPaymentModal(false);
      navigate('/home');
    }, 2000);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f5f5f7, #ffffff)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        paddingBottom: '80px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Go back"
            >
              <ArrowLeft style={{ width: '20px', height: '20px', color: '#1d1d1f' }} />
            </button>
            <h1
              style={{
                fontSize: 'clamp(24px, 4vw, 34px)',
                fontWeight: '700',
                letterSpacing: '-0.5px',
                color: '#1d1d1f',
              }}
            >
              Select Your Coach
            </h1>
          </div>

          {/* Filter Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(16px)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <button
              onClick={() => setViewMode('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'all' ? '#ff3c20' : 'transparent',
                color: viewMode === 'all' ? '#ffffff' : '#6e6e73',
                transition: 'all 0.2s',
              }}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('online')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'online' ? '#ff3c20' : 'transparent',
                color: viewMode === 'online' ? '#ffffff' : '#6e6e73',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Video style={{ width: '14px', height: '14px' }} />
              Online
            </button>
            <button
              onClick={() => setViewMode('offline')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'offline' ? '#ff3c20' : 'transparent',
                color: viewMode === 'offline' ? '#ffffff' : '#6e6e73',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <MapPinned style={{ width: '14px', height: '14px' }} />
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
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
            gridTemplateColumns: selectedCoach
              ? 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))'
              : '1fr',
            gap: '24px',
          }}
        >
          {/* Coach List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p
              style={{
                fontSize: '15px',
                color: '#6e6e73',
                fontWeight: '500',
              }}
            >
              {filteredCoaches.length} coaches available
            </p>

            {filteredCoaches.map((coach) => (
              <div
                key={coach.id}
                onClick={() => handleSelectCoach(coach.id)}
                style={{
                  background:
                    selectedCoach === coach.id
                      ? 'rgba(255, 60, 32, 0.05)'
                      : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border:
                    selectedCoach === coach.id
                      ? '2px solid #ff3c20'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow:
                    selectedCoach === coach.id
                      ? '0 8px 24px rgba(255, 60, 32, 0.15)'
                      : '0 4px 16px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}
                >
                  <Avatar
                    style={{
                      width: '100px',
                      height: '100px',
                      border: '3px solid rgba(255, 60, 32, 0.2)',
                      flexShrink: 0,
                    }}
                  >
                    <AvatarImage src={coach.image} />
                    <AvatarFallback>
                      {coach.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#1d1d1f',
                            marginBottom: '4px',
                          }}
                        >
                          {coach.name}
                        </h3>
                        <p
                          style={{
                            fontSize: '15px',
                            color: '#ff3c20',
                            fontWeight: '600',
                            marginBottom: '4px',
                          }}
                        >
                          {coach.specialty}
                        </p>
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#6e6e73',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Award style={{ width: '14px', height: '14px' }} />
                          {coach.experience} experience
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open chat functionality
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
                        }}
                        aria-label="Chat with coach"
                      >
                        <MessageCircle
                          style={{ width: '18px', height: '18px', color: '#ff3c20' }}
                        />
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(52, 199, 89, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}
                      >
                        <Star
                          style={{
                            width: '14px',
                            height: '14px',
                            color: '#34c759',
                            fill: '#34c759',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#34c759' }}>
                          {coach.rating}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                          ({coach.reviews})
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(255, 60, 32, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                        }}
                      >
                        <Users style={{ width: '14px', height: '14px', color: '#ff3c20' }} />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#ff3c20' }}>
                          {coach.clients} clients
                        </span>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '14px',
                        color: '#1d1d1f',
                        lineHeight: '1.5',
                        marginBottom: '12px',
                      }}
                    >
                      {coach.bio}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <MapPin style={{ width: '14px', height: '14px', color: '#6e6e73' }} />
                      <span style={{ fontSize: '13px', color: '#6e6e73' }}>{coach.location}</span>
                      {coach.mode.map((m) => (
                        <span
                          key={m}
                          style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            background:
                              m === 'Online' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(255, 60, 32, 0.1)',
                            borderRadius: '6px',
                            color: m === 'Online' ? '#007aff' : '#ff3c20',
                            fontWeight: '600',
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      {coach.certifications.map((cert) => (
                        <span
                          key={cert}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '6px',
                            color: '#1d1d1f',
                            fontWeight: '500',
                          }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Package Selection */}
          {selectedCoach && (
            <div
              style={{
                position: 'sticky',
                top: '20px',
                height: 'fit-content',
              }}
            >
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
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    letterSpacing: '-0.5px',
                    color: '#1d1d1f',
                    marginBottom: '20px',
                  }}
                >
                  Choose a Package
                </h2>

                {/* Subscription Type Toggle */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    padding: '4px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <button
                    onClick={() => setSubscriptionType('monthly')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: subscriptionType === 'monthly' ? '#ff3c20' : 'transparent',
                      color: subscriptionType === 'monthly' ? '#ffffff' : '#6e6e73',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSubscriptionType('yearly')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: subscriptionType === 'yearly' ? '#ff3c20' : 'transparent',
                      color: subscriptionType === 'yearly' ? '#ffffff' : '#6e6e73',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Yearly
                    <span
                      style={{
                        background: '#34c759',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      SAVE
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coaches
                    .find((c) => c.id === selectedCoach)
                    ?.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg.id)}
                        style={{
                          background:
                            selectedPackage === pkg.id
                              ? 'rgba(255, 60, 32, 0.05)'
                              : 'rgba(255, 255, 255, 0.5)',
                          border:
                            selectedPackage === pkg.id
                              ? '2px solid #ff3c20'
                              : '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: '16px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative',
                        }}
                      >
                        {selectedPackage === pkg.id && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: '#ff3c20',
                              borderRadius: '50%',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check style={{ width: '14px', height: '14px', color: '#ffffff' }} />
                          </div>
                        )}

                        <div style={{ marginBottom: '12px' }}>
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#1d1d1f',
                              marginBottom: '4px',
                            }}
                          >
                            {pkg.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <p
                              style={{
                                fontSize: '14px',
                                color: '#6e6e73',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Calendar style={{ width: '14px', height: '14px' }} />
                              {pkg.duration}
                            </p>
                            <p
                              style={{
                                fontSize: '14px',
                                color: '#6e6e73',
                              }}
                            >
                              {pkg.sessions} sessions
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#ff3c20',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '8px',
                          }}
                        >
                          <span>
                            ₹
                            {subscriptionType === 'monthly'
                              ? pkg.monthlyPrice.toLocaleString()
                              : pkg.yearlyPrice.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '500', color: '#6e6e73' }}>
                            /{subscriptionType === 'monthly' ? 'month' : 'year'}
                          </span>
                          {subscriptionType === 'yearly' && (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#34c759',
                                background: 'rgba(52, 199, 89, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              Save{' '}
                              {Math.round((1 - pkg.yearlyPrice / (pkg.monthlyPrice * 12)) * 100)}%
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {pkg.features.map((feature, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: '#1d1d1f',
                              }}
                            >
                              <Check style={{ width: '14px', height: '14px', color: '#34c759' }} />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {selectedPackage && (
                  <Button
                    onClick={handleSubscribe}
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      background: '#ff3c20',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 60, 32, 0.3)',
                    }}
                  >
                    Subscribe Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
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
              Select Payment Method
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: '14px',
                color: '#6e6e73',
                marginBottom: '24px',
              }}
            >
              Choose your preferred payment method to complete the subscription
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {/* Credit/Debit Card */}
            <div
              onClick={() => setSelectedPaymentMethod('card')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border:
                  selectedPaymentMethod === 'card'
                    ? '2px solid #ff3c20'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'card' ? 'rgba(255, 60, 32, 0.05)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '2px',
                  }}
                >
                  Credit / Debit Card
                </p>
                <p style={{ fontSize: '13px', color: '#6e6e73' }}>Visa, Mastercard, Rupay</p>
              </div>
              {selectedPaymentMethod === 'card' && (
                <Check style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              )}
            </div>

            {/* UPI */}
            <div
              onClick={() => setSelectedPaymentMethod('upi')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border:
                  selectedPaymentMethod === 'upi'
                    ? '2px solid #ff3c20'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background: selectedPaymentMethod === 'upi' ? 'rgba(255, 60, 32, 0.05)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '2px',
                  }}
                >
                  UPI
                </p>
                <p style={{ fontSize: '13px', color: '#6e6e73' }}>Google Pay, PhonePe, Paytm</p>
              </div>
              {selectedPaymentMethod === 'upi' && (
                <Check style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              )}
            </div>

            {/* Net Banking */}
            <div
              onClick={() => setSelectedPaymentMethod('netbanking')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border:
                  selectedPaymentMethod === 'netbanking'
                    ? '2px solid #ff3c20'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'netbanking' ? 'rgba(255, 60, 32, 0.05)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '2px',
                  }}
                >
                  Net Banking
                </p>
                <p style={{ fontSize: '13px', color: '#6e6e73' }}>All major banks supported</p>
              </div>
              {selectedPaymentMethod === 'netbanking' && (
                <Check style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              )}
            </div>

            {/* Wallets */}
            <div
              onClick={() => setSelectedPaymentMethod('wallet')}
              style={{
                padding: '16px',
                borderRadius: '16px',
                border:
                  selectedPaymentMethod === 'wallet'
                    ? '2px solid #ff3c20'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'wallet' ? 'rgba(255, 60, 32, 0.05)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #fa709a, #fee140)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    marginBottom: '2px',
                  }}
                >
                  Wallets
                </p>
                <p style={{ fontSize: '13px', color: '#6e6e73' }}>Paytm, Amazon Pay, PhonePe</p>
              </div>
              {selectedPaymentMethod === 'wallet' && (
                <Check style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 60, 32, 0.05)',
              border: '1px solid rgba(255, 60, 32, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6e6e73' }}>Total Amount</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#ff3c20' }}>
                ₹
                {selectedCoach && selectedPackage
                  ? (() => {
                      const coach = filteredCoaches.find((c) => c.id === selectedCoach);
                      const pkg = coach?.packages.find((p) => p.id === selectedPackage);
                      return subscriptionType === 'monthly'
                        ? pkg?.monthlyPrice.toLocaleString()
                        : pkg?.yearlyPrice.toLocaleString();
                    })()
                  : '0'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessing}
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
              onClick={handlePaymentConfirm}
              disabled={!selectedPaymentMethod || isProcessing}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: !selectedPaymentMethod || isProcessing ? '#d1d1d6' : '#ff3c20',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !selectedPaymentMethod || isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isProcessing ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default SelectCoach;
