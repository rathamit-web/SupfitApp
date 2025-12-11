import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageCircle,
  Check,
  Dumbbell,
  Clock,
  Users,
  Wifi,
  IndianRupee,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Footer from '@/components/Footer';

interface GymPackage {
  id: number;
  name: string;
  duration: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
}

interface Gym {
  id: number;
  name: string;
  distance: string;
  rating: number;
  reviews: number;
  image: string;
  address: string;
  amenities: string[];
  packages: GymPackage[];
}

const SelectGym = () => {
  const navigate = useNavigate();
  const [selectedGym, setSelectedGym] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const gyms: Gym[] = [
    {
      id: 1,
      name: 'PowerFit Gym',
      distance: '0.8 km',
      rating: 4.8,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      address: 'Sector 18, Noida',
      amenities: ['AC', 'WiFi', 'Parking', 'Lockers', 'Shower'],
      packages: [
        {
          id: 1,
          name: 'Basic',
          duration: '1 Month',
          monthlyPrice: '₹1,999',
          yearlyPrice: '₹19,999',
          features: ['All Equipment Access', 'Locker Facility', 'Free WiFi'],
        },
        {
          id: 2,
          name: 'Standard',
          duration: '3 Months',
          monthlyPrice: '₹1,799',
          yearlyPrice: '₹17,999',
          features: ['All Equipment Access', 'Locker Facility', 'Free WiFi', '1 Free PT Session'],
        },
        {
          id: 3,
          name: 'Premium',
          duration: '12 Months',
          monthlyPrice: '₹1,499',
          yearlyPrice: '₹14,999',
          features: [
            'All Equipment Access',
            'Locker Facility',
            'Free WiFi',
            '5 Free PT Sessions',
            'Diet Plan',
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Elite Fitness Center',
      distance: '1.2 km',
      rating: 4.6,
      reviews: 189,
      image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80',
      address: 'Sector 62, Noida',
      amenities: ['AC', 'Sauna', 'Steam', 'Parking', 'Cafe'],
      packages: [
        {
          id: 1,
          name: 'Standard',
          duration: '1 Month',
          monthlyPrice: '₹2,499',
          yearlyPrice: '₹24,999',
          features: ['All Equipment Access', 'Steam & Sauna', 'Locker Facility'],
        },
        {
          id: 2,
          name: 'Premium',
          duration: '6 Months',
          monthlyPrice: '₹2,199',
          yearlyPrice: '₹21,999',
          features: [
            'All Equipment Access',
            'Steam & Sauna',
            'Locker Facility',
            '3 Free PT Sessions',
            'Supplements Discount',
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'FitZone Pro',
      distance: '2.0 km',
      rating: 4.9,
      reviews: 312,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
      address: 'Sector 15, Noida',
      amenities: ['AC', 'WiFi', 'Parking', 'Pool', 'Spa', 'Cafe'],
      packages: [
        {
          id: 1,
          name: 'Premium',
          duration: '1 Month',
          monthlyPrice: '₹3,499',
          yearlyPrice: '₹34,999',
          features: ['All Equipment Access', 'Swimming Pool', 'Spa Access', 'Locker & Towel'],
        },
        {
          id: 2,
          name: 'Elite',
          duration: '12 Months',
          monthlyPrice: '₹2,999',
          yearlyPrice: '₹29,999',
          features: [
            'All Equipment Access',
            'Swimming Pool',
            'Spa Access',
            'Locker & Towel',
            '10 Free PT Sessions',
            'Nutrition Counseling',
            'Guest Passes',
          ],
        },
      ],
    },
  ];

  const handleSelectGym = (gymId: number) => {
    setSelectedGym(gymId);
    setSelectedPackage(null);
  };

  const handleSelectPackage = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = () => {
    if (!selectedGym || !selectedPackage) return;
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const gym = gyms.find((g) => g.id === selectedGym);
      const pkg = gym?.packages.find((p) => p.id === selectedPackage);

      if (gym && pkg) {
        // Calculate validity date
        const validFrom = new Date();
        const validUpto = new Date();

        if (subscriptionType === 'monthly') {
          validUpto.setMonth(validUpto.getMonth() + 1);
        } else {
          validUpto.setFullYear(validUpto.getFullYear() + 1);
        }

        const subscription = {
          id: 1,
          type: 'My Gym',
          name: gym.name,
          status: 'paid',
          amount: subscriptionType === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice,
          validFrom: validFrom.toISOString(),
          validUpto: validUpto.toISOString(),
          subscriptionType,
          packageName: pkg.name,
        };

        // Save to localStorage
        localStorage.setItem('gymSubscription', JSON.stringify(subscription));
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
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
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
          Select Your Gym
        </h1>
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
            gridTemplateColumns: selectedGym
              ? 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))'
              : '1fr',
            gap: '24px',
          }}
        >
          {/* Gym List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p
              style={{
                fontSize: '15px',
                color: '#6e6e73',
                fontWeight: '500',
              }}
            >
              {gyms.length} gyms found near you
            </p>

            {gyms.map((gym) => (
              <div
                key={gym.id}
                onClick={() => handleSelectGym(gym.id)}
                style={{
                  background:
                    selectedGym === gym.id ? 'rgba(255, 60, 32, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border:
                    selectedGym === gym.id ? '2px solid #ff3c20' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow:
                    selectedGym === gym.id
                      ? '0 8px 24px rgba(255, 60, 32, 0.15)'
                      : '0 4px 16px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img
                    src={gym.image}
                    alt={gym.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '12px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MapPin style={{ width: '14px', height: '14px', color: '#ff3c20' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
                      {gym.distance}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#1d1d1f',
                          marginBottom: '4px',
                        }}
                      >
                        {gym.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '14px',
                          color: '#6e6e73',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin style={{ width: '14px', height: '14px' }} />
                        {gym.address}
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
                      aria-label="Chat with gym"
                    >
                      <MessageCircle style={{ width: '18px', height: '18px', color: '#ff3c20' }} />
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '16px',
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
                        style={{ width: '14px', height: '14px', color: '#34c759', fill: '#34c759' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#34c759' }}>
                        {gym.rating}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6e6e73' }}>
                      ({gym.reviews} reviews)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {gym.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          background: 'rgba(0, 0, 0, 0.05)',
                          borderRadius: '8px',
                          color: '#1d1d1f',
                          fontWeight: '500',
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Package Selection */}
          {selectedGym && (
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
                    marginBottom: '16px',
                  }}
                >
                  Choose a Package
                </h2>

                {/* Subscription Type Toggle */}
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    marginBottom: '16px',
                  }}
                >
                  <button
                    onClick={() => setSubscriptionType('monthly')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      background: subscriptionType === 'monthly' ? '#ff3c20' : 'transparent',
                      color: subscriptionType === 'monthly' ? '#ffffff' : '#6e6e73',
                      transition: 'all 0.2s',
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSubscriptionType('yearly')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      background: subscriptionType === 'yearly' ? '#ff3c20' : 'transparent',
                      color: subscriptionType === 'yearly' ? '#ffffff' : '#6e6e73',
                      transition: 'all 0.2s',
                    }}
                  >
                    Yearly
                    <span
                      style={{
                        marginLeft: '4px',
                        fontSize: '11px',
                        padding: '2px 6px',
                        background:
                          subscriptionType === 'yearly'
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(52, 199, 89, 0.15)',
                        color: subscriptionType === 'yearly' ? '#ffffff' : '#34c759',
                        borderRadius: '4px',
                        fontWeight: '700',
                      }}
                    >
                      SAVE
                    </span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {gyms
                    .find((g) => g.id === selectedGym)
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
                          <p
                            style={{
                              fontSize: '14px',
                              color: '#6e6e73',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock style={{ width: '14px', height: '14px' }} />
                            {pkg.duration}
                          </p>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div
                            style={{
                              fontSize: '28px',
                              fontWeight: '700',
                              color: '#ff3c20',
                              marginBottom: '4px',
                            }}
                          >
                            {subscriptionType === 'monthly' ? pkg.monthlyPrice : pkg.yearlyPrice}
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#6e6e73',
                                marginLeft: '6px',
                              }}
                            >
                              /{subscriptionType === 'monthly' ? 'month' : 'year'}
                            </span>
                          </div>
                          {subscriptionType === 'yearly' && (
                            <p
                              style={{
                                fontSize: '12px',
                                color: '#34c759',
                                fontWeight: '600',
                              }}
                            >
                              Save{' '}
                              {Math.round(
                                (1 -
                                  parseInt(pkg.yearlyPrice.replace(/[^\d]/g, '')) /
                                    (parseInt(pkg.monthlyPrice.replace(/[^\d]/g, '')) * 12)) *
                                  100,
                              )}
                              % with yearly plan
                            </p>
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
                {selectedGym && selectedPackage
                  ? (() => {
                      const gym = gyms.find((g) => g.id === selectedGym);
                      const pkg = gym?.packages.find((p) => p.id === selectedPackage);
                      return subscriptionType === 'monthly' ? pkg?.monthlyPrice : pkg?.yearlyPrice;
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

export default SelectGym;
