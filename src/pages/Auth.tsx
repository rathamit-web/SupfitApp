import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supfitLogo from '@/assets/supfit-logo.png';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>('');
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl) {
      setUserRole(roleFromUrl);
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
      navigate('/');
    } else {
      const roleParam = userRole ? `?role=${userRole}` : '';
      navigate(`/create-profile${roleParam}`);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    const roleParam = userRole ? `?role=${userRole}` : '';
    navigate(`/create-profile${roleParam}`);
  };

  return (
    <div className="w-full flex justify-center px-4 py-6 sm:py-8">
      <div className="signup-container">
        {/* Logo inside palette */}
        <img src={supfitLogo} alt="Supfit" className="signup-logo" />
        <div className="signup-toggle">
          <div className={`signup-toggle-thumb ${isLogin ? 'right' : ''}`} />
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`signup-toggle-btn ${isSignup ? 'active' : ''}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`signup-toggle-btn ${isLogin ? 'active' : ''}`}
          >
            Log In
          </button>
        </div>
        {/* Title & Subtitle */}
        <h1 className="signup-title leading-tight">{isLogin ? 'Welcome Back!' : 'Sign Up'}</h1>
        <p className="signup-subtitle leading-snug text-sm">
          {isLogin ? 'Login to start your fitness journey' : "Let's get your account set up"}
        </p>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 max-w-sm mx-auto">
          {!isLogin && (
            <div className="grid grid-cols-1">
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
                className="signup-input focus:outline-none"
              />
            </div>
          )}
          <div className="grid grid-cols-1">
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
              className="signup-input focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1">
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
              className="signup-input focus:outline-none"
            />
          </div>
          <button type="submit" className="signup-btn h-10 text-sm sm:h-11 sm:text-base">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        {/* Separator */}
        <div className="signup-divider">
          <span>or</span>
        </div>

        {/* Social Sign-in Options */}
        <div className="max-w-sm mx-auto mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="signup-social-btn"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.6h5.1c-.2 1.3-1.5 3.7-5.1 3.7-3.1 0-5.6-2.6-5.6-5.7s2.5-5.7 5.6-5.7c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.6 14.6 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 9.6-4.9 9.6-7.5 0-.5-.1-.8-.1-1.1H12z"
                />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            className="signup-social-btn"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="#111827"
                  d="M16.365 12.64c-.03-3.012 2.463-4.49 2.573-4.56-1.406-2.053-3.592-2.337-4.365-2.373-1.856-.19-3.619 1.088-4.56 1.088-.94 0-2.397-1.06-3.943-1.03-2.03.03-3.915 1.185-4.957 3.01-2.108 3.65-.54 9.063 1.516 12.03 1.006 1.452 2.2 3.08 3.77 3.02 1.515-.06 2.086-.976 3.922-.976 1.836 0 2.346.976 3.943.946 1.635-.03 2.673-1.482 3.676-2.94 1.157-1.69 1.635-3.34 1.665-3.43-.03-.03-3.196-1.226-3.24-4.785zM13.44 4.625c.835-1.013 1.399-2.43 1.248-3.84-1.21.05-2.672.805-3.537 1.818-.776.896-1.457 2.327-1.276 3.71 1.335.1 2.73-.675 3.565-1.688z"
                />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-700">Continue with Apple</span>
          </button>

          {/* Mobile OTP */}
          <button
            type="button"
            onClick={() => handleSocialLogin('Mobile OTP')}
            className="signup-social-btn"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <rect x="7" y="3" width="10" height="18" rx="2" fill="#10B981" />
                <rect x="9" y="5" width="6" height="14" rx="1" fill="#ffffff" />
                <circle cx="12" cy="17.5" r="1" fill="#D1D5DB" />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-700">Login with Mobile OTP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Auth;
