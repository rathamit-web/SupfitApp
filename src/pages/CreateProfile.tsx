import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import supfitLogo from '@/assets/supfit-logo.png';

const CreateProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [userRole, setUserRole] = useState<'individual' | 'coach'>('individual');
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: '',
    heightUnit: 'cm',
    height: '',
    weightUnit: 'kg',
    weight: '',
    location: '',
    goal: '',
  });

  useEffect(() => {
    // Check if role is passed via URL params or localStorage
    const roleFromUrl = searchParams.get('role');
    const roleFromStorage = localStorage.getItem('userRole');

    if (roleFromUrl === 'coach') {
      setUserRole('coach');
      localStorage.setItem('userRole', 'coach');
    } else if (roleFromStorage === 'coach') {
      setUserRole('coach');
    } else {
      setUserRole('individual');
      localStorage.setItem('userRole', 'individual');
    }
  }, [searchParams]);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleGoToHome = () => {
    // Navigate based on user role
    if (userRole === 'coach' || profileData.goal === 'Coach' || profileData.goal === 'Dietician') {
      navigate('/coach');
    } else {
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/auth');
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFDFD' }}>
      {/* Logo */}
      <div className="flex justify-center" style={{ paddingTop: '16px', paddingBottom: '12px' }}>
        <img
          src={supfitLogo}
          alt="Supfit"
          style={{ width: '140px', height: 'auto', mixBlendMode: 'multiply' }}
        />
      </div>

      {/* Header */}
      {step !== 4 && (
        <>
          <div
            className="flex items-center justify-between py-4"
            style={{ paddingLeft: '16px', paddingRight: '16px' }}
          >
            <button
              onClick={handleBack}
              className="transition-colors"
              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}
            >
              <ArrowLeft className="w-6 h-6" style={{ color: '#333' }} />
            </button>
            <div className="flex-1 text-center">
              <h1 className="font-bold" style={{ fontSize: '18px' }}>
                Create Profile
              </h1>
            </div>
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'right', minWidth: '80px' }}>
              Step {step} of 3
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ paddingLeft: '28px', paddingRight: '28px', marginBottom: '24px' }}>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '999px',
                    backgroundColor: i <= step ? '#FF3C20' : '#E5E5E5',
                    transition: 'background-color 0.3s',
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Content */}
      <div style={{ paddingLeft: '28px', paddingRight: '28px' }}>
        {step === 1 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#FF3C20',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '-0.5px',
                }}
              >
                Let's Get Started
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#666',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  lineHeight: '1.5',
                }}
              >
                Tell us a bit about yourself.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input-glass"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                Age
              </label>
              <input
                type="number"
                placeholder="Enter your age"
                value={profileData.age}
                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                className="input-glass"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '12px',
                }}
              >
                Gender
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['Male', 'Female', 'Other'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setProfileData({ ...profileData, gender })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      border:
                        profileData.gender === gender
                          ? '2px solid #FF3C20'
                          : '1px solid rgba(255, 60, 32, 0.2)',
                      backgroundColor:
                        profileData.gender === gender
                          ? 'rgba(255, 60, 32, 0.08)'
                          : 'rgba(255, 60, 32, 0.03)',
                      color: '#FF3C20',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#FF3C20',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '-0.5px',
                }}
              >
                A Little About You
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#666',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  lineHeight: '1.5',
                }}
              >
                This helps us tailor recommendations and connect you with the right clients.
              </p>
            </div>

            {/* Height */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '12px',
                }}
              >
                Height
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, heightUnit: 'cm' })}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    border: 'none',
                    backgroundColor:
                      profileData.heightUnit === 'cm' ? '#ff3c20' : 'rgba(255, 60, 32, 0.1)',
                    color: profileData.heightUnit === 'cm' ? '#fff' : '#ff3c20',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, heightUnit: 'ft' })}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    border: 'none',
                    backgroundColor:
                      profileData.heightUnit === 'ft' ? '#ff3c20' : 'rgba(255, 60, 32, 0.1)',
                    color: profileData.heightUnit === 'ft' ? '#fff' : '#ff3c20',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ft
                </button>
              </div>
              <input
                type="number"
                placeholder={`Enter height in ${profileData.heightUnit}`}
                value={profileData.height}
                onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                className="input-glass"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>

            {/* Weight */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '12px',
                }}
              >
                Weight
              </label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, weightUnit: 'kg' })}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    border: 'none',
                    backgroundColor:
                      profileData.weightUnit === 'kg' ? '#ff3c20' : 'rgba(255, 60, 32, 0.1)',
                    color: profileData.weightUnit === 'kg' ? '#fff' : '#ff3c20',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, weightUnit: 'lbs' })}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    border: 'none',
                    backgroundColor:
                      profileData.weightUnit === 'lbs' ? '#ff3c20' : 'rgba(255, 60, 32, 0.1)',
                    color: profileData.weightUnit === 'lbs' ? '#fff' : '#ff3c20',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  lbs
                </button>
              </div>
              <input
                type="number"
                placeholder={`Enter weight in ${profileData.weightUnit}`}
                value={profileData.weight}
                onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                className="input-glass"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: '32px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '12px',
                }}
              >
                Location
              </label>
              <input
                type="text"
                placeholder="Enter your location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="input-glass"
                style={{
                  width: '100%',
                  height: '52px',
                  padding: '0 16px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#FF3C20',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '-0.5px',
                }}
              >
                What's Your Goal?
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#666',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                  lineHeight: '1.5',
                }}
              >
                Choose your main focus. You can always change this later.
              </p>
            </div>

            {/* Goal Options */}
            <div style={{ marginBottom: '80px' }}>
              {[
                'Lose Weight',
                'Maintain Weight',
                'Stay Healthy',
                'Body Building',
                'Learn Badminton',
                'Coach',
                'Dietician',
              ].map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setProfileData({ ...profileData, goal })}
                  className="input-glass"
                  style={{
                    width: '100%',
                    height: '56px',
                    marginBottom: '12px',
                    padding: '0 16px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#333',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    border: profileData.goal === goal ? '2px solid #ff3c20' : 'none',
                    backgroundColor:
                      profileData.goal === goal ? 'rgba(255, 60, 32, 0.05)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${profileData.goal === goal ? '#ff3c20' : '#ddd'}`,
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {profileData.goal === goal && (
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#ff3c20',
                        }}
                      />
                    )}
                  </div>
                  {goal}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              paddingTop: '40px',
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 60, 32, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 60, 32, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF3C20"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h2
              style={{
                fontSize: '34px',
                fontWeight: '700',
                color: '#FF3C20',
                marginBottom: '16px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
                letterSpacing: '-0.5px',
              }}
            >
              You're All Set!
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: '#666',
                lineHeight: '1.6',
                maxWidth: '320px',
                marginBottom: '60px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Congratulations on setting up your professional profile. You're ready to start
              managing your clients and growing your business.
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px 24px 20px',
          backgroundColor: '#FDFDFD',
          zIndex: 100,
        }}
      >
        {step === 1 ? (
          <button
            onClick={handleNext}
            disabled={!profileData.name || !profileData.age || !profileData.gender}
            className="profile-next-btn"
            style={{
              width: '100%',
              height: '56px',
              padding: '0.625rem 0.75rem',
              borderRadius: '16px',
              backgroundColor:
                profileData.name && profileData.age && profileData.gender
                  ? '#ff3c20'
                  : 'rgba(255, 60, 32, 0.5)',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: 'bold',
              border: 'none',
              cursor:
                profileData.name && profileData.age && profileData.gender
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            Next
          </button>
        ) : step === 4 ? (
          <button
            onClick={handleGoToHome}
            className="profile-next-btn"
            style={{
              width: '100%',
              height: '56px',
              padding: '0.625rem 0.75rem',
              borderRadius: '16px',
              backgroundColor: '#ff3c20',
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Go to Home page
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleBack}
              style={{
                flex: '1',
                height: '56px',
                padding: '0.625rem 0.75rem',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 60, 32, 0.1)',
                color: '#ff3c20',
                fontSize: '17px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={step === 2 ? !profileData.height || !profileData.weight : !profileData.goal}
              className="profile-next-btn"
              style={{
                flex: '1',
                height: '56px',
                padding: '0.625rem 0.75rem',
                borderRadius: '16px',
                backgroundColor: (
                  step === 2 ? profileData.height && profileData.weight : profileData.goal
                )
                  ? '#ff3c20'
                  : 'rgba(255, 60, 32, 0.5)',
                color: '#ffffff',
                fontSize: '17px',
                fontWeight: 'bold',
                border: 'none',
                cursor: (step === 2 ? profileData.height && profileData.weight : profileData.goal)
                  ? 'pointer'
                  : 'not-allowed',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProfile;
