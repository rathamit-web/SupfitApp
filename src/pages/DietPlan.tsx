import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import broccoliImg from '../assets/broccoli.png';

// Supfit logo color (from Auth.tsx and SupplementRecommendation):
const SUPFIT_GRADIENT = 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)';
const SUPFIT_SOLID = '#ff3c20';

const dietPlans = [
  {
    title: 'Strength & Muscle Gain',
    target: '~130g protein, ~120g carbs/day',
    micronutrients: 'Iron, B12, Calcium, Magnesium',
    meals: {
      breakfast: [
        { icon: '🍳', text: '3 Egg Whites + 1 Whole Egg → 20g P, 2g C' },
        { icon: '🍞', text: 'Multigrain Toast → 6g P, 30g C' },
        { icon: '', text: '(Veg) Paneer Bhurji + Chapati → 24g P, 40g C' },
      ],
      lunch: [
        { icon: '🐟', text: 'Fish Curry + Brown Rice → 35g P, 40g C' },
        { icon: '', text: '(Veg) Dal + Quinoa → 20g P, 40g C' },
      ],
      dinner: [
        { icon: '🍗', text: 'Grilled Chicken + Sweet Potato → 38g P, 35g C' },
        { icon: '', text: '(Veg) Tofu Stir Fry + Brown Rice → 25g P, 40g C' },
      ],
    },
    button: 'Recommend',
  },
  {
    title: 'Endurance & Stamina',
    target: '~110g protein, ~150g carbs/day',
    micronutrients: 'Iron, Omega-3, B12, Zinc',
    meals: {
      breakfast: [
        { icon: '🥣', text: 'Oats + Boiled Eggs → 18g P, 40g C' },
        { icon: '', text: '(Veg) Idli + Sambar → 20g P, 35g C' },
      ],
      lunch: [
        { icon: '🍗', text: 'Chicken Curry + Chapati → 36g P, 40g C' },
        { icon: '', text: '(Veg) Rajma + Rice → 20g P, 35g C' },
      ],
      dinner: [
        { icon: '🐟', text: 'Grilled Fish + Vegetables → 35g P, 15g C' },
        { icon: '', text: '(Veg) Vegetable Khichdi → 12g P, 35g C' },
      ],
    },
    button: 'Recommend',
  },
  {
    title: 'Lean & Fat Loss',
    target: '~120g protein, ~90g carbs/day',
    micronutrients: 'Vitamin D, Calcium, Fiber',
    meals: {
      breakfast: [
        { icon: '🍳', text: 'Egg White Omelet + Salad → 18g P, 5g C' },
        { icon: '', text: '(Veg) Vegetable Dalia → 12g P, 30g C' },
      ],
      lunch: [
        { icon: '🐟', text: 'Fish Curry + Salad → 33g P, 10g C' },
        { icon: '', text: '(Veg) Paneer Curry + Veggies → 23g P, 15g C' },
      ],
      dinner: [
        { icon: '🍗', text: 'Chicken Breast + Greens → 35g P, 10g C' },
        { icon: '', text: '(Veg) Tofu + Broccoli → 25g P, 15g C' },
      ],
    },
    button: 'Recommend',
  },
  {
    title: 'Recovery & Wellness',
    target: '~115g protein, ~110g carbs/day',
    micronutrients: 'Vitamin C, Magnesium, Iron, B12',
    meals: {
      breakfast: [
        { icon: '🥣', text: 'Oats + Egg Whites → 18g P, 40g C' },
        { icon: '', text: '(Veg) Vegetable Upma → 15g P, 30g C' },
      ],
      lunch: [
        { icon: '🐓', text: 'Chicken Curry + Quinoa → 38g P, 40g C' },
        { icon: '', text: '(Veg) Paneer Curry + Chapati → 24g P, 40g C' },
      ],
      dinner: [
        { icon: '🐟', text: 'Fish Curry + Salad → 33g P, 10g C' },
        { icon: '', text: '(Veg) Vegetable Khichdi → 12g P, 35g C' },
      ],
    },
    button: 'Recommend',
  },
];

export default function DietPlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id || 'default';
  const [recommended, setRecommended] = useState('');
  const [editIdx, setEditIdx] = useState(null);
  const [editablePlans, setEditablePlans] = useState(() => dietPlans.map(plan => ({
    ...plan,
    meals: {
      breakfast: plan.meals.breakfast.map(item => ({ ...item })),
      lunch: plan.meals.lunch.map(item => ({ ...item })),
      dinner: plan.meals.dinner.map(item => ({ ...item })),
    },
  })));

  useEffect(() => {
    const stored = localStorage.getItem(`dietPlan_${userId}`);
    if (stored) {
      try {
        const plan = JSON.parse(stored);
        if (plan && plan.title) {
          setRecommended(plan.title);
          // If edited, load edited meals
          setEditablePlans(prev => prev.map(p =>
            p.title === plan.title && plan.meals ? { ...p, meals: plan.meals } : p
          ));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [userId]);

  const handleRecommend = (plan, idx) => {
    setRecommended(plan.title);
    localStorage.setItem(`dietPlan_${userId}`,
      JSON.stringify({ ...plan, date: new Date().toISOString() })
    );
    setEditIdx(null);
  };

  const handleEditToggle = (idx) => {
    setEditIdx(editIdx === idx ? null : idx);
  };

  const handleMealChange = (planIdx, mealType, itemIdx, value) => {
    setEditablePlans(prev => prev.map((plan, idx) => {
      if (idx !== planIdx) return plan;
      return {
        ...plan,
        meals: {
          ...plan.meals,
          [mealType]: plan.meals[mealType].map((item, i) => i === itemIdx ? { ...item, text: value } : item),
        },
      };
    }));
  };

  // Back button handler
  const handleBack = () => navigate(`/client/${userId}`);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #f5f5f7 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Roboto", "Google Sans", "Helvetica Neue", Arial, sans-serif',
        paddingBottom: 'max(80px, env(safe-area-inset-bottom, 24px))',
        letterSpacing: '-0.24px',
        paddingLeft: 'max(8px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(8px, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        style={{
          maxWidth: '98vw',
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(12px, 5vw, 24px)',
          position: 'relative',
        }}
      >
        {/* Back Button at top, styled like SupplementRecommendation */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginTop: 0 }}>
          {/* Back button overlays on top of icon/title */}
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.85)',
              color: SUPFIT_SOLID,
              border: 'none',
              borderRadius: '50%',
              width: 48,
              height: 48,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px #ff3c2044',
              cursor: 'pointer',
              transition: 'all 0.2s',
              filter: 'drop-shadow(0 2px 8px #ff3c2044)',
              fontSize: 28,
              fontWeight: 700,
              zIndex: 2,
              touchAction: 'manipulation',
              borderWidth: 0,
            }}
            aria-label="Go back"
          >
            {/* Apple-style chevron left icon (SVG) */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
              <path d="M18 24L10 14L18 4" stroke={SUPFIT_SOLID} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1
            style={{
              fontSize: 'clamp(22px, 6vw, 28px)',
              fontWeight: 700,
              letterSpacing: '-0.8px',
              margin: 0,
              background: SUPFIT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              lineHeight: 1.2,
              display: 'inline-block',
              padding: '0 32px',
              minHeight: 44,
            }}
          >
            Unified Diet Plan
          </h1>
        </div>
        {editablePlans.map((plan, idx) => (
          <div
            key={plan.title}
            style={{
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 4px 24px rgba(255,60,32,0.08)',
              border: recommended === plan.title ? '2px solid #28a745' : '1.5px solid #ffe5e0',
              marginBottom: 32,
              overflow: 'hidden',
              position: 'relative',
              padding: 0,
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <div style={{ height: 8, background: SUPFIT_GRADIENT }} />
            <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 22, color: SUPFIT_SOLID, marginBottom: 8 }}>{plan.title}</h2>
              <div style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 600, marginBottom: 4 }}>Target: <span style={{ fontWeight: 400 }}>{plan.target}</span></div>
              <div style={{ fontSize: 14, color: '#6e6e73', marginBottom: 12 }}>Micronutrients: {plan.micronutrients}</div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Breakfast</div>
                  <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 8 }}>
                    {plan.meals.breakfast.map((item, i) => (
                      <li key={i} style={{ fontSize: 16, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                        {item.icon}{' '}
                        {editIdx === idx ? (
                          <input
                            value={item.text}
                            onChange={e => handleMealChange(idx, 'breakfast', i, e.target.value)}
                            style={{
                              fontSize: 16,
                              border: '1px solid #eee',
                              borderRadius: 6,
                              padding: '8px 10px',
                              width: '80%',
                              minHeight: 44,
                              marginLeft: 4,
                            }}
                          />
                        ) : <span style={{ fontSize: 16 }}>{item.text}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Lunch</div>
                  <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 8 }}>
                    {plan.meals.lunch.map((item, i) => (
                      <li key={i} style={{ fontSize: 16, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                        {item.icon}{' '}
                        {editIdx === idx ? (
                          <input
                            value={item.text}
                            onChange={e => handleMealChange(idx, 'lunch', i, e.target.value)}
                            style={{
                              fontSize: 16,
                              border: '1px solid #eee',
                              borderRadius: 6,
                              padding: '8px 10px',
                              width: '80%',
                              minHeight: 44,
                              marginLeft: 4,
                            }}
                          />
                        ) : <span style={{ fontSize: 16 }}>{item.text}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontWeight: 600, color: '#1d1d1f', marginBottom: 4 }}>Dinner</div>
                  <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 8 }}>
                    {plan.meals.dinner.map((item, i) => (
                      <li key={i} style={{ fontSize: 16, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                        {item.icon}{' '}
                        {editIdx === idx ? (
                          <input
                            value={item.text}
                            onChange={e => handleMealChange(idx, 'dinner', i, e.target.value)}
                            style={{
                              fontSize: 16,
                              border: '1px solid #eee',
                              borderRadius: 6,
                              padding: '8px 10px',
                              width: '80%',
                              minHeight: 44,
                              marginLeft: 4,
                            }}
                          />
                        ) : <span style={{ fontSize: 16 }}>{item.text}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button
                  onClick={() => handleRecommend(plan, idx)}
                  style={{
                    flex: 1,
                    background: recommended === plan.title ? '#e0f7e0' : SUPFIT_GRADIENT,
                    color: recommended === plan.title ? '#28a745' : '#fff',
                    fontWeight: 700,
                    borderRadius: 14,
                    boxShadow: '0 2px 8px rgba(255,60,32,0.13)',
                    border: 'none',
                    fontSize: 18,
                    padding: '16px 0',
                    minHeight: 48,
                    letterSpacing: '-0.2px',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  {recommended === plan.title ? 'Selected' : plan.button}
                </Button>
                <Button
                  onClick={() => handleEditToggle(idx)}
                  style={{
                    flex: 1,
                    background: editIdx === idx ? 'linear-gradient(90deg, #ffe5e0 60%, #ffb347 100%)' : '#fff',
                    color: SUPFIT_SOLID,
                    fontWeight: 700,
                    borderRadius: 14,
                    boxShadow: '0 2px 8px rgba(255,60,32,0.07)',
                    border: `1.5px solid ${SUPFIT_SOLID}`,
                    fontSize: 18,
                    padding: '16px 0',
                    minHeight: 48,
                    letterSpacing: '-0.2px',
                    transition: 'all 0.2s',
                    touchAction: 'manipulation',
                  }}
                  variant="outline"
                >
                  {editIdx === idx ? 'Save' : 'Modify'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
