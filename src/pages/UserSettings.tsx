import { useState } from 'react';
import {
  Target,
  FileText,
  Activity,
  Upload,
  Smartphone,
  Lock,
  Globe,
  Home,
  Dumbbell,
  LayoutDashboard,
  User,
  ChevronRight,
  Shield,
  FileHeart,
  Pill,
  Camera,
  Bluetooth,
  Watch,
  Plus,
} from 'lucide-react';

const UserSettings = () => {
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState<string[]>(
    JSON.parse(localStorage.getItem('connectedDevices') || '[]'),
  );
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  const handleFileUpload = (type: string) => {
    console.log(`Uploading ${type}`);
  };

  const handleAddDevice = () => {
    setShowDeviceModal(true);
  };

  const handleConnectDevice = () => {
    if (!selectedBrand) return;
    setIsConnecting(true);
    setTimeout(() => {
      const updated = [...connectedDevices, selectedBrand];
      setConnectedDevices(updated);
      localStorage.setItem('connectedDevices', JSON.stringify(updated));
      setIsConnecting(false);
      setShowDeviceModal(false);
      setSelectedBrand('');
    }, 2000);
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
      {/* Header */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '0.5px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ff3c20',
            margin: 0,
            letterSpacing: '-0.5px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
          }}
        >
          User Settings
        </h1>
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Profile Privacy */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isProfilePublic
                    ? 'linear-gradient(135deg, rgba(255, 60, 32, 0.15) 0%, rgba(255, 87, 34, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 60, 32, 0.15) 0%, rgba(255, 149, 0, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isProfilePublic ? (
                  <Globe style={{ width: '24px', height: '24px', color: '#ff3c20' }} />
                ) : (
                  <Lock style={{ width: '24px', height: '24px', color: '#ff3c20' }} />
                )}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 4px 0',
                  }}
                >
                  Profile Visibility
                </h3>
                <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                  {isProfilePublic ? 'Your profile is public' : 'Your profile is private'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfilePublic(!isProfilePublic)}
              style={{
                width: '52px',
                height: '32px',
                borderRadius: '16px',
                border: 'none',
                background: isProfilePublic ? '#ff3c20' : '#e5e5e7',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: isProfilePublic ? '22px' : '2px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Create Target */}
        <button
          onClick={() => (window.location.href = '/targets')}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textAlign: 'left',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background:
                    'linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(10, 132, 255, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target style={{ width: '24px', height: '24px', color: '#007aff' }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 4px 0',
                  }}
                >
                  My Targets
                </h3>
                <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                  Set your fitness goals and milestones
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#6e6e73' }} />
          </div>
        </button>

        {/* Connect Device */}
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Watch style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              Connected Device
            </h3>
          </div>
          {connectedDevices.length > 0 ? (
            <ul style={{ margin: '0 0 12px 0', padding: 0, listStyle: 'none' }}>
              {connectedDevices.map((dev, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '15px',
                    color: '#007aff',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Bluetooth style={{ width: '18px', height: '18px', color: '#007aff' }} />
                  {dev}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '12px' }}>
              No device connected
            </p>
          )}
          <button
            onClick={handleAddDevice}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '16px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,60,32,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <Plus style={{ width: '20px', height: '20px' }} /> Add Device
          </button>
        </div>

        {/* Device Modal */}
        {showDeviceModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.18)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => !isConnecting && setShowDeviceModal(false)}
          >
            <div
              style={{
                minWidth: '340px',
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                alignItems: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1d1d1f',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                }}
              >
                Connect Smartwatch
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#6e6e73',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Select your smartwatch brand to connect via Bluetooth
              </p>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={isConnecting}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e5e7',
                  fontSize: '16px',
                  color: '#1d1d1f',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                  marginBottom: '18px',
                  outline: 'none',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  background: '#fff',
                }}
              >
                <option value="">Select Brand</option>
                <option value="Apple Watch">Apple Watch</option>
                <option value="Google Pixel Watch">Google Pixel Watch</option>
                <option value="Garmin">Garmin</option>
                <option value="Whoop">Whoop</option>
                <option value="Samsung Galaxy Watch">Samsung Galaxy Watch</option>
                <option value="Fitbit">Fitbit</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={handleConnectDevice}
                disabled={!selectedBrand || isConnecting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: !selectedBrand || isConnecting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255,60,32,0.15)',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isConnecting ? (
                  <>
                    <Bluetooth
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#fff',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Bluetooth style={{ width: '20px', height: '20px', color: '#fff' }} />
                    Connect
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <h2
            style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f', margin: '0 0 16px 0' }}
          >
            Health Documents
          </h2>

          {/* Vital Reports */}
          <label
            htmlFor="vital-upload"
            style={{
              display: 'block',
              padding: '16px',
              background: 'rgba(0, 122, 255, 0.05)',
              borderRadius: '14px',
              marginBottom: '12px',
              cursor: 'pointer',
              border: '1px dashed rgba(0, 122, 255, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 122, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(0, 122, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity style={{ width: '20px', height: '20px', color: '#007aff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Vital Reports
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Blood tests, vitals, and health metrics
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#007aff' }} />
            </div>
            <input
              id="vital-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('vital')}
            />
          </label>

          {/* Prescription */}
          <label
            htmlFor="prescription-upload"
            style={{
              display: 'block',
              padding: '16px',
              background: 'rgba(52, 199, 89, 0.05)',
              borderRadius: '14px',
              marginBottom: '12px',
              cursor: 'pointer',
              border: '1px dashed rgba(52, 199, 89, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52, 199, 89, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(52, 199, 89, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(52, 199, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pill style={{ width: '20px', height: '20px', color: '#34c759' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Prescriptions
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Medical prescriptions and medications
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#34c759' }} />
            </div>
            <input
              id="prescription-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('prescription')}
            />
          </label>

          {/* Medical History */}
          <label
            htmlFor="medical-upload"
            style={{
              display: 'block',
              padding: '16px',
              background: 'rgba(255, 60, 32, 0.05)',
              borderRadius: '14px',
              cursor: 'pointer',
              border: '1px dashed rgba(255, 60, 32, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 60, 32, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 60, 32, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 60, 32, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 60, 32, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 60, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileHeart style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Medical History
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Past medical records and history
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
            </div>
            <input
              id="medical-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('medical')}
            />
          </label>
        </div>
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

export default UserSettings;
