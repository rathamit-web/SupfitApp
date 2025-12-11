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
  UtensilsCrossed,
  Video,
  MapPinned,
  Clipboard,
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

interface DieticianPackage {
  id: number;
  name: string;
  duration: string;
  monthlyPrice: number;
  yearlyPrice: number;
  consultations: number;
  features: string[];
}

interface Dietician {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  experience: string;
  rating: number;
  reviews: number;
  clients: number;
  image: string;
  location: string;
  mode: string[];
  specializations: string[];
  packages: DieticianPackage[];
  bio: string;
}

const SelectDietician = () => {
  const navigate = useNavigate();
  const [selectedDietician, setSelectedDietician] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'online' | 'offline'>('all');
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dieticians: Dietician[] = [
    {
      id: 1,
      name: 'Dr. Sarah Kim',
      specialty: 'Clinical Nutritionist',
      qualification: 'PhD in Nutrition Science',
      experience: '12 years',
      rating: 4.9,
      reviews: 298,
      clients: 156,
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
      location: 'Sector 18, Noida',
      mode: ['Online', 'Offline'],
      specializations: [
        'Weight Management',
        'PCOS Diet',
        'Sports Nutrition',
        'Diabetes Management',
      ],
      bio: 'Expert in personalized nutrition plans with a focus on sustainable lifestyle changes. Helped 1000+ clients achieve their health goals.',
      packages: [
        {
          id: 1,
          name: 'Basic Plan',
          duration: '1 Month',
          monthlyPrice: 3999,
          yearlyPrice: 39999,
          consultations: 4,
          features: [
            '4 Consultations',
            'Personalized Diet Plan',
            'Weekly Follow-ups',
            'WhatsApp Support',
          ],
        },
        {
          id: 2,
          name: 'Premium Plan',
          duration: '3 Months',
          monthlyPrice: 9999,
          yearlyPrice: 99999,
          consultations: 12,
          features: [
            '12 Consultations',
            'Customized Meal Plans',
            'Recipe Guide',
            'Supplement Advice',
            '24/7 Support',
            'Progress Tracking',
          ],
        },
        {
          id: 3,
          name: 'Elite Plan',
          duration: '6 Months',
          monthlyPrice: 17999,
          yearlyPrice: 179999,
          consultations: 24,
          features: [
            '24 Consultations',
            'Complete Nutrition Program',
            'Family Diet Plans',
            'Recipe Books',
            'Shopping Lists',
            'Priority Support',
            'Blood Work Analysis',
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      specialty: 'Wellness Nutritionist',
      qualification: 'MSc Clinical Nutrition',
      experience: '8 years',
      rating: 5.0,
      reviews: 187,
      clients: 94,
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80',
      location: 'Online Only',
      mode: ['Online'],
      specializations: ['Gut Health', 'Anti-Aging', 'Immunity Boost', 'Detox Programs'],
      bio: 'Holistic approach to nutrition focusing on gut health and overall wellness. Specialized in natural healing through food.',
      packages: [
        {
          id: 1,
          name: 'Wellness Starter',
          duration: '1 Month',
          monthlyPrice: 2999,
          yearlyPrice: 29999,
          consultations: 3,
          features: [
            '3 Online Consultations',
            'Wellness Diet Plan',
            'Email Support',
            'Food Diary Template',
          ],
        },
        {
          id: 2,
          name: 'Complete Wellness',
          duration: '3 Months',
          monthlyPrice: 7999,
          yearlyPrice: 79999,
          consultations: 9,
          features: [
            '9 Online Consultations',
            'Holistic Nutrition Plan',
            'Gut Health Guide',
            'Detox Protocols',
            'Monthly Reviews',
            'Recipe Collection',
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Dr. Amit Verma',
      specialty: 'Sports Nutritionist',
      qualification: 'MSc Sports Nutrition',
      experience: '10 years',
      rating: 4.8,
      reviews: 245,
      clients: 128,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      location: 'Sector 62, Noida',
      mode: ['Online', 'Offline'],
      specializations: [
        'Athletic Performance',
        'Muscle Gain',
        'Body Recomposition',
        'Endurance Training',
      ],
      bio: 'Specialized in athlete nutrition and performance optimization. Working with professional athletes and fitness enthusiasts.',
      packages: [
        {
          id: 1,
          name: 'Performance Plan',
          duration: '2 Months',
          monthlyPrice: 8999,
          yearlyPrice: 89999,
          consultations: 8,
          features: [
            '8 Consultations',
            'Performance Diet Plan',
            'Pre/Post Workout Nutrition',
            'Supplement Protocol',
          ],
        },
        {
          id: 2,
          name: 'Elite Athlete',
          duration: '6 Months',
          monthlyPrice: 24999,
          yearlyPrice: 249999,
          consultations: 24,
          features: [
            '24 Consultations',
            'Competition Prep Plans',
            'Body Composition Analysis',
            'Supplement Stack',
            'Performance Tracking',
            'Priority Support',
            'Meal Timing Guide',
          ],
        },
      ],
    },
  ];

  const filteredDieticians =
    viewMode === 'all'
      ? dieticians
      : dieticians.filter((dietician) =>
          viewMode === 'online'
            ? dietician.mode.includes('Online')
            : dietician.mode.includes('Offline'),
        );

  const handleSelectDietician = (dieticianId: number) => {
    setSelectedDietician(dieticianId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = () => {
    if (!selectedDietician || !selectedPackage) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const dietician = filteredDieticians.find((d) => d.id === selectedDietician);
      const pkg = dietician?.packages.find((p) => p.id === selectedPackage);

      if (dietician && pkg) {
        const amount = subscriptionType === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice;
        const validFrom = new Date();
        const validUpto = new Date();

        if (subscriptionType === 'monthly') {
          validUpto.setMonth(validUpto.getMonth() + 1);
        } else {
          validUpto.setFullYear(validUpto.getFullYear() + 1);
        }

        const subscription = {
          id: selectedDietician,
          type: 'Dietician',
          name: dietician.name,
          status: 'paid',
          amount: amount,
          validFrom: validFrom.toISOString(),
          validUpto: validUpto.toISOString(),
          subscriptionType: subscriptionType,
          packageName: pkg.name,
        };

        localStorage.setItem('dieticianSubscription', JSON.stringify(subscription));
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
              Select Your Dietician
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
            gridTemplateColumns: selectedDietician
              ? 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))'
              : '1fr',
            gap: '24px',
          }}
        >
          {/* Dietician List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p
              style={{
                fontSize: '15px',
                color: '#6e6e73',
                fontWeight: '500',
              }}
            >
              {filteredDieticians.length} dieticians available
            </p>

            {filteredDieticians.map((dietician) => (
              <div
                key={dietician.id}
                onClick={() => handleSelectDietician(dietician.id)}
                style={{
                  background:
                    selectedDietician === dietician.id
                      ? 'rgba(255, 60, 32, 0.05)'
                      : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border:
                    selectedDietician === dietician.id
                      ? '2px solid #ff3c20'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '20px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow:
                    selectedDietician === dietician.id
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
                      border: '3px solid rgba(52, 199, 89, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    <AvatarImage src={dietician.image} />
                    <AvatarFallback>
                      {dietician.name
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
                          {dietician.name}
                        </h3>
                        <p
                          style={{
                            fontSize: '15px',
                            color: '#34c759',
                            fontWeight: '600',
                            marginBottom: '2px',
                          }}
                        >
                          {dietician.specialty}
                        </p>
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#6e6e73',
                            marginBottom: '2px',
                          }}
                        >
                          {dietician.qualification}
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
                          {dietician.experience} experience
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open chat functionality
                        }}
                        style={{
                          background: 'rgba(52, 199, 89, 0.1)',
                          border: '1px solid rgba(52, 199, 89, 0.2)',
                          borderRadius: '10px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label="Chat with dietician"
                      >
                        <MessageCircle
                          style={{ width: '18px', height: '18px', color: '#34c759' }}
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
                          {dietician.rating}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6e6e73' }}>
                          ({dietician.reviews})
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
                          {dietician.clients} clients
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
                      {dietician.bio}
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
                      <span style={{ fontSize: '13px', color: '#6e6e73' }}>
                        {dietician.location}
                      </span>
                      {dietician.mode.map((m) => (
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
                      {dietician.specializations.map((spec) => (
                        <span
                          key={spec}
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            background: 'rgba(52, 199, 89, 0.1)',
                            border: '1px solid rgba(52, 199, 89, 0.2)',
                            borderRadius: '6px',
                            color: '#34c759',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UtensilsCrossed style={{ width: '10px', height: '10px' }} />
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Package Selection */}
          {selectedDietician && (
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
                      background: subscriptionType === 'monthly' ? '#34c759' : 'transparent',
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
                      background: subscriptionType === 'yearly' ? '#34c759' : 'transparent',
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
                        background: '#007aff',
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
                  {dieticians
                    .find((d) => d.id === selectedDietician)
                    ?.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg.id)}
                        style={{
                          background:
                            selectedPackage === pkg.id
                              ? 'rgba(52, 199, 89, 0.05)'
                              : 'rgba(255, 255, 255, 0.5)',
                          border:
                            selectedPackage === pkg.id
                              ? '2px solid #34c759'
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
                              background: '#34c759',
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
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Clipboard style={{ width: '14px', height: '14px' }} />
                              {pkg.consultations} consultations
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: '#34c759',
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
                                color: '#007aff',
                                background: 'rgba(0, 122, 255, 0.1)',
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
                      background: '#34c759',
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '16px',
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
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
                    ? '2px solid #34c759'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'card' ? 'rgba(52, 199, 89, 0.05)' : '#ffffff',
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
                <Check style={{ width: '20px', height: '20px', color: '#34c759' }} />
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
                    ? '2px solid #34c759'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background: selectedPaymentMethod === 'upi' ? 'rgba(52, 199, 89, 0.05)' : '#ffffff',
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
                <Check style={{ width: '20px', height: '20px', color: '#34c759' }} />
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
                    ? '2px solid #34c759'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'netbanking' ? 'rgba(52, 199, 89, 0.05)' : '#ffffff',
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
                <Check style={{ width: '20px', height: '20px', color: '#34c759' }} />
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
                    ? '2px solid #34c759'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                background:
                  selectedPaymentMethod === 'wallet' ? 'rgba(52, 199, 89, 0.05)' : '#ffffff',
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
                <Check style={{ width: '20px', height: '20px', color: '#34c759' }} />
              )}
            </div>
          </div>

          {/* Amount Display */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(52, 199, 89, 0.05)',
              border: '1px solid rgba(52, 199, 89, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6e6e73' }}>Total Amount</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#34c759' }}>
                ₹
                {selectedDietician && selectedPackage
                  ? (() => {
                      const dietician = filteredDieticians.find((d) => d.id === selectedDietician);
                      const pkg = dietician?.packages.find((p) => p.id === selectedPackage);
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
                background: !selectedPaymentMethod || isProcessing ? '#d1d1d6' : '#34c759',
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

export default SelectDietician;
