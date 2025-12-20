import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supfitLogo from '../assets/Supfitlogo.png';
import GoogleIcon from '@/assets/GoogleIcon.svg';
import AppleLogo from '@/components/AppleLogo';
import MobileIcon from '@/assets/MobileIcon.svg';

const Auth = () => {
    // Add missing social login handlers to prevent ReferenceError
    // Social login handlers using Supabase
    const handleGoogleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) alert('Google sign-in failed: ' + error.message);
    };

    const handleAppleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
      if (error) alert('Apple sign-in failed: ' + error.message);
    };

    const handleMobileLogin = async () => {
      const phone = prompt('Enter your phone number (with country code):');
      if (!phone) return;
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) alert('OTP sign-in failed: ' + error.message);
      else alert('OTP sent! Please check your phone.');
    };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>('');
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl) {
      setUserRole(roleFromUrl);
      localStorage.setItem('userRole', roleFromUrl);
    } else {
      // fallback to localStorage if no role in URL
      const roleFromStorage = localStorage.getItem('userRole');
      if (roleFromStorage) {
        setUserRole(roleFromStorage);
      }
    }
  }, [searchParams]);
  const isSignup = !isLogin;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to profile creation after signup
    if (isLogin) {
      if (userRole === 'coach' || userRole === 'dietician') {
        localStorage.setItem('userRole', userRole);
        navigate('/coach-home');
      } else {
        localStorage.setItem('userRole', userRole || 'individual');
        navigate('/home');
      }
    } else {
      // Always go to /create-profile (which now renders CreateProfileStep1)
      navigate('/create-profile');
    }
  };

  // Removed unused handleSocialLogin function

  return (
      <>
      <div
        className="min-h-screen w-full flex items-center justify-center px-[env(safe-area-inset-left,1vw)] py-[env(safe-area-inset-top,1vh)]"
        style={{
          minHeight: '100vh',
          fontFamily: 'SF Pro Display, SF Pro Text, Roboto, Arial, sans-serif',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f5d0fe 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Apple glass effect card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.65)',
            borderRadius: 'clamp(8px, 2vw, 16px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
            padding: 'clamp(12px, 5vw, 24px) clamp(8px, 5vw, 20px) clamp(16px, 6vw, 28px)',
            maxWidth: 'min(370px, 96vw)',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
        {/* Logo centered at top with reduced spacing */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 0, marginTop: 0 }}>
          <img
            src={supfitLogo}
            alt="Supfit"
            style={{
              width: '150px',
              maxWidth: '60vw',
              height: 'auto',
              background: 'transparent',
              borderRadius: 0,
              boxShadow: 'none',
              filter: 'drop-shadow(0 2px 12px #ff3c2066)',
              margin: 0,
              verticalAlign: 'middle',
              display: 'block',
            }}
          />
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            padding: 0,
            borderRadius: 9999,
            border: '2px solid rgba(255,255,255,0.35)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.35) 100%)',
            boxShadow: '0 4px 18px 0 #ff3c2033, 0 1.5px 8px #fff8',
            width: '100%',
            maxWidth: 'min(320px, 90vw)',
            margin: '0 auto 2vh',
            minHeight: 44,
          }}
        >
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              borderRadius: 9999,
              background: isSignup
                  ? 'linear-gradient(90deg, #ff3c20 0%, #ff8c42 100%)'
                  : 'transparent',
                color: isSignup ? '#fff' : '#ff3c20',
                fontWeight: 700,
                fontSize: 15,
                padding: '9px 0',
                margin: 2,
                boxShadow: isSignup
                  ? '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8'
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                filter: isSignup ? 'drop-shadow(0 2px 8px #ff3c2044)' : 'none',
                textShadow: isSignup ? '0 1px 2px #ff8c4288' : 'none',
                minWidth: 0,
                minHeight: 36,
                borderBottom: isSignup ? '2px solid #fff6' : 'none',
            }}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              borderRadius: 9999,
              background: isLogin
                  ? 'linear-gradient(90deg, #ff3c20 0%, #ff8c42 100%)'
                  : 'transparent',
                color: isLogin ? '#fff' : '#ff3c20',
                fontWeight: 700,
                fontSize: 15,
                padding: '9px 0',
                margin: 2,
                boxShadow: isLogin
                  ? '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8'
                  : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                filter: isLogin ? 'drop-shadow(0 2px 8px #ff3c2044)' : 'none',
                textShadow: isLogin ? '0 1px 2px #ff8c4288' : 'none',
                minWidth: 0,
                minHeight: 36,
                borderBottom: isLogin ? '2px solid #fff6' : 'none',
            }}
          >
            Log In
          </button>
        </div>
        {/* Title & Subtitle */}
        {/* Removed heading above form (Sign Up / Welcome Back) */}
          {/* Removed sign up heading and subtext below toggle button */}
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-1 leading-snug"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  border: '1.5px solid #e0e7ff',
                  fontSize: 15,
                  background: 'rgba(243,244,246,0.7)',
                  marginBottom: 2,
                  outline: 'none',
                }}
              />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-1 leading-snug"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid #e0e7ff',
                fontSize: 15,
                background: 'rgba(243,244,246,0.7)',
                marginBottom: 2,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-1 leading-snug"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                padding: '12px',
                borderRadius: 12,
                border: '1.5px solid #e0e7ff',
                fontSize: 15,
                background: 'rgba(243,244,246,0.7)',
                marginBottom: 2,
                outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #ff3c20 0%, #ff8c42 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              border: 'none',
              marginTop: 10,
              marginBottom: 2,
              boxShadow: '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8',
              cursor: 'pointer',
              transition: 'background 0.2s',
              filter: 'drop-shadow(0 2px 8px #ff3c2044)',
              textShadow: '0 1px 2px #ff8c4288',
              minHeight: 38,
            }}
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        {/* Separator */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          margin: '10px 0 2px',
          color: '#a1a1aa',
          fontWeight: 500,
          fontSize: 13,
          letterSpacing: '0.2px',
        }}>or</div>

        {/* Social Sign-in Options */}
        <div style={{
          width: '100%',
          maxWidth: 'min(320px, 90vw)',
          margin: '0 auto',
          marginTop: '2vh',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(8px, 2vw, 14px)',
        }}>
          {/* Redesigned social login section as per screenshot */}
          <div style={{ marginTop: 12, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', marginBottom: 18, textAlign: 'center', letterSpacing: '-0.5px' }}>Continue with</h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 'clamp(18px, 8vw, 48px)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, minWidth: 180 }}>
              <button
                onClick={handleGoogleLogin}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 'clamp(4px, 2vw, 8px)',
                  width: 'clamp(36px, 12vw, 48px)',
                  height: 'clamp(36px, 12vw, 48px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px #0001',
                  transition: 'box-shadow 0.2s',
                }}
                aria-label="Continue with Google"
              >
                <img src={GoogleIcon} alt="Google" style={{ width: 'clamp(20px, 7vw, 28px)', height: 'clamp(20px, 7vw, 28px)', display: 'block' }} />
              </button>
              <button
                onClick={handleAppleLogin}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 'clamp(4px, 2vw, 8px)',
                  width: 'clamp(36px, 12vw, 48px)',
                  height: 'clamp(36px, 12vw, 48px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px #0001',
                  transition: 'box-shadow 0.2s',
                }}
                aria-label="Continue with Apple"
              >
                <AppleLogo width={28} height={28} style={{ width: 'clamp(20px, 7vw, 28px)', height: 'clamp(20px, 7vw, 28px)', display: 'block' }} />
              </button>
              <button
                onClick={handleMobileLogin}
                style={{
                  background: '#fff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  padding: 'clamp(4px, 2vw, 8px)',
                  width: 'clamp(36px, 12vw, 48px)',
                  height: 'clamp(36px, 12vw, 48px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px #0001',
                  transition: 'box-shadow 0.2s',
                }}
                aria-label="Continue with Mobile OTP"
              >
                <img src={MobileIcon} alt="Mobile OTP" style={{ width: 'clamp(20px, 7vw, 28px)', height: 'clamp(20px, 7vw, 28px)', display: 'block' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
    );
  }
export default Auth;
