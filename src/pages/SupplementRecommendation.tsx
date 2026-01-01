import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';

const plans = [
  {
    title: 'Strength & Muscle Gain',
    emoji: '⚡',
    preIcon: 'Coffee',
    postIcon: 'CupSoda',
    pre: [
      { icon: '💊', value: 'Caffeine (200mg) – 30 min before' },
      { icon: '🔬', value: 'Beta‑Alanine (3g) – 20 min before' },
    ],
    post: [
      { icon: '🥤', value: 'Whey Protein (30g) + Creatine (5g) – within 30 min' },
      { icon: '🌱', value: 'Glutamine (5g) – recovery' },
    ],
  },
  {
    title: 'Endurance & Stamina',
    emoji: '🏃',
    preIcon: 'Droplet',
    postIcon: 'Leaf',
    pre: [
      { icon: '💧', value: 'Electrolyte Mix – 20 min before' },
      { icon: '💪', value: 'BCAA (5g) – reduce fatigue' },
    ],
    post: [
      { icon: '🌿', value: 'Plant Protein (25g) – within 30 min' },
      { icon: '🐟', value: 'Omega‑3 (1g) – inflammation control' },
    ],
  },
  {
    title: 'Lean & Fat Loss',
    emoji: '💪',
    preIcon: 'Apple',
    postIcon: 'CupSoda',
    pre: [
      { icon: '🍵', value: 'Green Tea Extract (250mg) – 30 min before' },
      { icon: '🔥', value: 'L‑Carnitine (1g) – fat metabolism' },
    ],
    post: [
      { icon: '🥤', value: 'Whey Isolate (25g) – within 30 min' },
      { icon: '💊', value: 'CLA (1g) – lean muscle retention' },
    ],
  },
  {
    title: 'Recovery & Wellness',
    emoji: '🧘',
    preIcon: 'Coffee',
    postIcon: 'Fish',
    pre: [
      { icon: '💧', value: 'Hydration Mix – 20 min before' },
      { icon: '⚡', value: 'Magnesium (200mg) – muscle relaxation' },
    ],
    post: [
      { icon: '🥛', value: 'Casein Protein (25g) – slow release recovery' },
      { icon: '🍊', value: 'Vitamin C (500mg) – immune support' },
    ],
  },
];

// Helper: editable supplement item
function EditableSuppItem({ value, onChange, readOnly, icon }) {
  return readOnly ? (
    <li>{icon} {value}</li>
  ) : (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <input
        style={{ flex: 1, border: '1px solid #eee', borderRadius: 6, padding: '4px 8px' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </li>
  );
}

// Component for each supplement plan card
function SupplementPlanCard({ plan, editState, supps, onEditToggle, onRecommend, recommendedPlan, userId }) {
  const handleRecommendClick = () => {
    const draft = {
      title: plan.title,
      iconName: plan.preIcon, // Simplified
      color: 'from-orange-400 to-red-500', // Placeholder
      pre: supps.pre.map(item => ({ iconName: plan.preIcon, label: item.value.split(' – ')[0], note: item.value.split(' – ')[1] || '' })),
      post: supps.post.map(item => ({ iconName: plan.postIcon, label: item.value.split(' – ')[0], note: item.value.split(' – ')[1] || '' })),
    };
    onRecommend(plan.title, draft, userId);
  };

  return (
    <div style={{
      borderRadius: 20,
      boxShadow: '0 4px 24px rgba(255,60,32,0.08)',
      border: recommendedPlan === plan.title ? '2px solid #28a745' : '1.5px solid #ffe5e0',
      background: '#fff',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 320,
      marginBottom: 24,
    }}>
      <div style={{ height: 8, background: 'linear-gradient(90deg, #ff3c20 60%, #ffb347 100%)' }} />
      <div style={{ padding: '24px 24px 16px', flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: 24, color: '#ff3c20', marginBottom: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          {plan.emoji} {plan.title}
        </h3>
        <div style={{ fontWeight: 600, fontSize: 18, color: '#1d1d1f', marginBottom: 12, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Pre‑Workout</div>
        <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 12 }}>
          {supps.pre.map((item, i) => (
            <EditableSuppItem
              key={i}
              value={item.value}
              icon={item.icon}
              readOnly={!editState}
              onChange={val => supps.setPre(prev => prev.map((it, idx) => idx === i ? { ...it, value: val } : it))}
            />
          ))}
        </ul>
        <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>Post‑Workout</div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {supps.post.map((item, i) => (
            <EditableSuppItem
              key={i}
              value={item.value}
              icon={item.icon}
              readOnly={!editState}
              onChange={val => supps.setPost(prev => prev.map((it, idx) => idx === i ? { ...it, value: val } : it))}
            />
          ))}
        </ul>
      </div>
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 12 }}>
        <Button
          onClick={handleRecommendClick}
          style={{
            flex: 1,
            background: recommendedPlan === plan.title ? '#e0f7e0' : 'linear-gradient(90deg, #ff3c20 60%, #ffb347 100%)',
            color: recommendedPlan === plan.title ? '#28a745' : '#fff',
            fontWeight: 700,
            borderRadius: 14,
            boxShadow: '0 2px 8px rgba(255,60,32,0.13)',
            border: 'none',
            fontSize: 16,
            padding: '12px 0',
            letterSpacing: '-0.2px',
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
        >
          {recommendedPlan === plan.title ? 'Select' : 'Recommend'}
        </Button>
        <Button
          style={{
            flex: 1,
            background: editState ? 'linear-gradient(90deg, #ffe5e0 60%, #ffb347 100%)' : '#fff',
            color: '#ff3c20',
            fontWeight: 700,
            borderRadius: 14,
            boxShadow: '0 2px 8px rgba(255,60,32,0.07)',
            border: '1.5px solid #ff3c20',
            fontSize: 16,
            padding: '12px 0',
            letterSpacing: '-0.2px',
            transition: 'all 0.2s',
          }}
          variant="outline"
          onClick={onEditToggle}
        >
          {editState ? 'Save' : 'Modify'}
        </Button>
      </div>
    </div>
  );
}

export default function SupplementRecommendation() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id || 'default';
  const [recommendedPlan, setRecommendedPlan] = useState(null);

  // State for each plan's edit mode and supplements
  const [planStates, setPlanStates] = useState(() =>
    plans.map(plan => ({
      edit: false,
      supps: { pre: [...plan.pre], post: [...plan.post] },
      setPre: () => {},
      setPost: () => {},
    }))
  );

  // Initialize setters
  useEffect(() => {
    setPlanStates(prev =>
      prev.map((state, idx) => ({
        ...state,
        setPre: (updater) => setPlanStates(current => current.map((s, i) => i === idx ? { ...s, supps: { ...s.supps, pre: updater(s.supps.pre) } } : s)),
        setPost: (updater) => setPlanStates(current => current.map((s, i) => i === idx ? { ...s, supps: { ...s.supps, post: updater(s.supps.post) } } : s)),
      }))
    );
  }, []);

  // Load previous recommendation from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`supplementPlan_${userId}`);
    if (stored) {
      try {
        const plan = JSON.parse(stored);
        if (plan && plan.length > 0) {
          setRecommendedPlan(plan[0].title);
        }
      } catch (e) {
        console.error('Error parsing stored supplement plan:', e);
      }
    }
  }, [userId]);

  const handleBack = () => navigate(`/client/${userId}`);

  const handleRecommend = (title, draft, userId) => {
    setRecommendedPlan(title);
    localStorage.setItem(`supplementPlan_${userId}`, JSON.stringify([draft]));
  };

  const handleEditToggle = (idx) => {
    setPlanStates(prev => prev.map((state, i) => i === idx ? { ...state, edit: !state.edit } : state));
  };

  return (
    <>
      <main className="bg-gradient-to-br from-orange-50 to-gray-100" style={{ paddingTop: 0, paddingBottom: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      </main>
      {/* Apple liquid glass effect container */}
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: 'clamp(12px, 3vw, 20px)',
            left: 'clamp(12px, 3vw, 20px)',
            background: 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 'clamp(36px, 8vw, 48px)',
            height: 'clamp(36px, 8vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            filter: 'drop-shadow(0 2px 8px #ff3c2044)',
            textShadow: '0 1px 2px #ff8c4288',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
          aria-label="Go back"
        >
          ←
        </button>
        {/* Supplement Plan Reference Content (UI/Coach Only) */}
        <section className="max-w-md mx-auto px-4 py-6 sm:max-w-lg md:max-w-xl lg:max-w-2xl" style={{ marginTop: 0, paddingTop: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', width: '100%' }}>
          <div style={{ marginTop: 0, paddingTop: 0 }}>
            <h1
              className="text-2xl sm:text-3xl font-bold text-center mb-6"
              style={{
                marginTop: 0,
                marginBottom: 0,
                background: 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Supplement Recommendations
            </h1>
            {/* Render plan cards */}
            {plans.map((plan, idx) => (
              <SupplementPlanCard
                key={plan.title}
                plan={plan}
                editState={planStates[idx]?.edit}
                supps={{ pre: planStates[idx]?.supps.pre, post: planStates[idx]?.supps.post, setPre: planStates[idx]?.setPre, setPost: planStates[idx]?.setPost }}
                onEditToggle={() => handleEditToggle(idx)}
                onRecommend={handleRecommend}
                recommendedPlan={recommendedPlan}
                userId={userId}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
