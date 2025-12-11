import { useState } from 'react';
import {
  Footprints,
  PersonStanding,
  Trophy,
  Dumbbell,
  Home,
  LayoutDashboard,
  User,
  Flag,
  Calendar,
  Zap,
  ChevronLeft,
} from 'lucide-react';

const MyTargets = () => {
  const [steps, setSteps] = useState(8000);
  const [running, setRunning] = useState(5);
  const [sports, setSports] = useState(60);
  const [workout, setWorkout] = useState(60);
  const [milestone, setMilestone] = useState('');
  const [milestoneMonth, setMilestoneMonth] = useState('');
  const [milestoneYear, setMilestoneYear] = useState('');

  const handleSaveDailyTargets = () => {
    localStorage.setItem('dailyTargets', JSON.stringify({ steps, running, sports, workout }));
    alert('Daily targets saved successfully!');
  };

  const handleSaveMilestone = () => {
    if (!milestone || !milestoneMonth || !milestoneYear) {
      alert('Please fill in all milestone fields');
      return;
    }
    localStorage.setItem(
      'milestoneTarget',
      JSON.stringify({ milestone, month: milestoneMonth, year: milestoneYear }),
    );
    alert('Milestone target saved successfully!');
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
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <button
          onClick={() => (window.location.href = '/settings')}
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '12px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}
          aria-label="Go back"
        >
          <ChevronLeft
            style={{ width: '24px', height: '24px', color: '#ff3c20', strokeWidth: 2 }}
          />
        </button>
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
          My Targets
        </h1>
        <p style={{ fontSize: '15px', color: '#6e6e73', margin: '4px 0 0 0' }}>
          Set your daily fitness goals
        </p>
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Daily Targets */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '20px',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <h2
            style={{ fontSize: '20px', fontWeight: '700', color: '#1d1d1f', margin: '0 0 8px 0' }}
          >
            Daily Targets
          </h2>
          <p style={{ fontSize: '14px', color: '#6e6e73', margin: '0 0 24px 0' }}>
            Set your daily fitness goals
          </p>

          {/* Steps Target */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background:
                      'linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(10, 132, 255, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Footprints style={{ width: '20px', height: '20px', color: '#007aff' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f' }}>Steps</span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#007aff' }}>{steps}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #007aff 0%, #007aff ${((steps - 1000) / 19000) * 100}%, #e5e5e7 ${((steps - 1000) / 19000) * 100}%, #e5e5e7 100%)`,
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Running Target */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background:
                      'linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(48, 209, 88, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonStanding style={{ width: '20px', height: '20px', color: '#34c759' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f' }}>
                  Running
                </span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#34c759' }}>
                {running} KM
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={running}
              onChange={(e) => setRunning(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #34c759 0%, #34c759 ${((running - 1) / 19) * 100}%, #e5e5e7 ${((running - 1) / 19) * 100}%, #e5e5e7 100%)`,
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Sports Target */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background:
                      'linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 179, 64, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy style={{ width: '20px', height: '20px', color: '#ff9500' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f' }}>
                  Sports
                </span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#ff9500' }}>
                {sports} mins
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={sports}
              onChange={(e) => setSports(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #ff9500 0%, #ff9500 ${((sports - 15) / 165) * 100}%, #e5e5e7 ${((sports - 15) / 165) * 100}%, #e5e5e7 100%)`,
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Workout Target */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background:
                      'linear-gradient(135deg, rgba(255, 60, 32, 0.15) 0%, rgba(255, 149, 0, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Dumbbell style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f' }}>
                  Workout
                </span>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#ff3c20' }}>
                {workout} mins
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={workout}
              onChange={(e) => setWorkout(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #ff3c20 0%, #ff3c20 ${((workout - 15) / 165) * 100}%, #e5e5e7 ${((workout - 15) / 165) * 100}%, #e5e5e7 100%)`,
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Save Daily Targets Button */}
          <button
            onClick={handleSaveDailyTargets}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255, 60, 32, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 60, 32, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 60, 32, 0.3)';
            }}
          >
            Save Daily Targets
          </button>
        </div>

        {/* Milestone */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '20px',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
              }}
            >
              <Flag style={{ width: '20px', height: '20px', color: '#8a2be2' }} />
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1d1d1f',
                margin: 0,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
              }}
            >
              Milestone Target
            </h2>
          </div>
          <p
            style={{
              fontSize: '14px',
              color: '#6e6e73',
              margin: '0 0 16px 0',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
            }}
          >
            Set a long-term fitness goal to work towards
          </p>
          <input
            type="text"
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            placeholder="e.g., Run a marathon, Complete triathlon"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.5)',
              fontSize: '15px',
              color: '#1d1d1f',
              outline: 'none',
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
              marginBottom: '16px',
            }}
          />

          {/* Month and Year Selection */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                }}
              >
                Target Month
              </label>
              <select
                value={milestoneMonth}
                onChange={(e) => setMilestoneMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '15px',
                  color: '#1d1d1f',
                  outline: 'none',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select Month</option>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                }}
              >
                Target Year
              </label>
              <select
                value={milestoneYear}
                onChange={(e) => setMilestoneYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '15px',
                  color: '#1d1d1f',
                  outline: 'none',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select Year</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
            </div>
          </div>

          {/* Save Milestone Button */}
          <button
            onClick={handleSaveMilestone}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255, 60, 32, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 60, 32, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 60, 32, 0.3)';
            }}
          >
            Save Milestone Target
          </button>
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

export default MyTargets;
