import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';

const defaultWorkoutPlan = [
  {
    day: 'Monday: Chest + Triceps',
    exercises: [
      'Bench Press (Barbell) → 4×10 (Strength)',
      'Incline Dumbbell Press → 3×12 (Hypertrophy)',
      'Chest Fly (Machine) → 3×15 (Isolation)',
      'Tricep Dips → 3×12 (Bodyweight)',
      'Rope Pushdown → 3×15 (Isolation)',
      'Stability Add‑on: Push‑ups on Stability Ball → 3×12 (Chest + core balance)',
    ],
  },
  {
    day: 'Tuesday: Back + Biceps',
    exercises: [
      'Pull‑Ups → 4×8 (Strength)',
      'Barbell Row → 4×10 (Compound)',
      'Lat Pulldown → 3×12 (Machine)',
      'Barbell Curl → 3×12 (Hypertrophy)',
      'Hammer Curl → 3×15 (Isolation)',
      'Stability Add‑on: Single‑Arm Dumbbell Row on Bench → 3×12 (Back + balance)',
    ],
  },
  {
    day: 'Wednesday: Legs + Core',
    exercises: [
      'Squats (Barbell) → 4×10 (Strength)',
      'Lunges (Dumbbell) → 3×12 each leg',
      'Leg Press → 3×15 (Machine)',
      'Plank Hold → 3×60s (Core stability)',
      'Russian Twists → 3×20 (Core rotation)',
      'Stability Add‑on: Single‑Leg Romanian Deadlift → 3×12 (Hamstring + balance)',
    ],
  },
  {
    day: 'Thursday: Shoulders + Abs',
    exercises: [
      'Overhead Press → 4×10 (Strength)',
      'Lateral Raises → 3×15 (Isolation)',
      'Front Raises → 3×12 (Variant)',
      'Hanging Leg Raises → 3×12 (Core strength)',
      'Bicycle Crunches → 3×20 (Core endurance)',
      'Stability Add‑on: Dumbbell Shoulder Press seated on Stability Ball → 3×12 (Shoulder + core)',
    ],
  },
  {
    day: 'Friday: Chest + Back (Push/Pull Mix)',
    exercises: [
      'Incline Bench Press → 4×10 (Chest strength)',
      'Weighted Push‑Ups → 3×15 (Chest endurance)',
      'Deadlift → 4×8 (Back strength)',
      'Seated Row (Cable) → 3×12 (Back hypertrophy)',
      'Stability Add‑on: TRX Chest Press → 3×12 (Chest + balance)',
    ],
  },
  {
    day: 'Saturday: Legs + Glutes',
    exercises: [
      'Romanian Deadlift → 4×10 (Hamstring/glute strength)',
      'Hip Thrusts → 3×12 (Glute hypertrophy)',
      'Leg Curl (Machine) → 3×15 (Isolation)',
      'Calf Raises → 3×20 (Endurance)',
      'Stability Add‑on: Lateral Band Walks → 3×15 (Glute stability)',
    ],
  },
  {
    day: 'Sunday: Rest / Recovery',
    exercises: [
      'Active Recovery: Yoga, stretching, foam rolling',
      'Stability Focus: Balance drills (single‑leg stance, Bosu ball holds)',
      'Optional: 20‑min walk or mobility flow',
    ],
  },
];

export default function WorkoutPlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = id || 'default';
  const [plan, setPlan] = useState(() => {
    const stored = localStorage.getItem(`workoutPlan_${userId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultWorkoutPlan;
      }
    }
    return defaultWorkoutPlan;
  });
  const [editIdx, setEditIdx] = useState(null);
  const [editExercises, setEditExercises] = useState([]);

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditExercises([...plan[idx].exercises]);
  };

  const handleSave = (idx) => {
    const updatedPlan = plan.map((day, i) =>
      i === idx ? { ...day, exercises: editExercises } : day
    );
    setPlan(updatedPlan);
    localStorage.setItem(`workoutPlan_${userId}`, JSON.stringify(updatedPlan));
    setEditIdx(null);
  };

  const handleAssign = () => {
    localStorage.setItem(`workoutPlan_${userId}`, JSON.stringify(plan));
    navigate(`/client/${userId}`);
  };

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #f5f5f7 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Roboto", "Google Sans", "Helvetica Neue", Arial, sans-serif', paddingBottom: '80px', letterSpacing: '-0.24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24, position: 'relative' }}>
        <button
          onClick={() => navigate(`/client/${userId}`)}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px #ff3c2044, 0 1.5px 8px #fff8',
            cursor: 'pointer',
            transition: 'all 0.2s',
            filter: 'drop-shadow(0 2px 8px #ff3c2044)',
            textShadow: '0 1px 2px #ff8c4288',
            fontSize: 18,
            fontWeight: 'bold',
            zIndex: 2,
          }}
          aria-label="Go back"
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M18 24L10 14L18 4" stroke="#ff3c20" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 24, background: 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: 1.2, display: 'inline-block', minHeight: 44 }}>🏋️‍♂️ Weekly Workout Plan (with Stability Work)</h1>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 24, background: 'linear-gradient(135deg, #ff3c20 0%, #ffb347 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: 1.2, display: 'inline-block', minHeight: 44 }}>Workout Plan</h1>
        {plan.map((day, idx) => (
          <div key={day.day} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(255,60,32,0.08)', border: '1.5px solid #ffe5e0', marginBottom: 32, overflow: 'hidden', position: 'relative', padding: 0 }}>
            <div style={{ height: 8, background: 'linear-gradient(90deg, #ff3c20 60%, #ffb347 100%)' }} />
            <div style={{ padding: 24 }}>
              <h2 style={{ fontWeight: 700, fontSize: 20, color: '#ff3c20', marginBottom: 8 }}>{day.day}</h2>
              <ul style={{ margin: 0, paddingLeft: 20, marginBottom: 8 }}>
                {(editIdx === idx ? editExercises : day.exercises).map((ex) => (
                  <li key={ex} style={{ fontSize: 16, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                    {editIdx === idx ? (
                      <input
                        value={editExercises[i]}
                        onChange={e => {
                          const updated = [...editExercises];
                          updated[i] = e.target.value;
                          setEditExercises(updated);
                        }}
                        style={{ fontSize: 16, border: '1px solid #eee', borderRadius: 6, padding: '8px 10px', width: '80%', minHeight: 44, marginLeft: 4 }}
                      />
                    ) : <span style={{ fontSize: 16 }}>{ex}</span>}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {editIdx === idx ? (
                  <Button
                    onClick={() => handleSave(idx)}
                    style={{ flex: 1, background: 'linear-gradient(90deg, #ffe5e0 60%, #ffb347 100%)', color: '#ff3c20', fontWeight: 700, borderRadius: 14, boxShadow: '0 2px 8px rgba(255,60,32,0.07)', border: '1.5px solid #ff3c20', fontSize: 18, padding: '16px 0', minHeight: 48, letterSpacing: '-0.2px', transition: 'all 0.2s', touchAction: 'manipulation' }}
                  >Save</Button>
                ) : (
                  <Button
                    onClick={() => handleEdit(idx)}
                    style={{ flex: 1, background: '#fff', color: '#ff3c20', fontWeight: 700, borderRadius: 14, boxShadow: '0 2px 8px rgba(255,60,32,0.07)', border: '1.5px solid #ff3c20', fontSize: 18, padding: '16px 0', minHeight: 48, letterSpacing: '-0.2px', transition: 'all 0.2s', touchAction: 'manipulation' }}
                  >Modify</Button>
                )}
              </div>
            </div>
          </div>
        ))}
        <Button
          onClick={handleAssign}
          style={{ width: '100%', background: 'linear-gradient(90deg, #ff3c20 60%, #ffb347 100%)', color: '#fff', fontWeight: 700, borderRadius: 14, fontSize: 18, padding: '16px 0', minHeight: 48, letterSpacing: '-0.2px', cursor: 'pointer', marginTop: 12, boxShadow: '0 2px 8px rgba(255, 60, 32, 0.3)' }}
        >Assign Workout Plan</Button>
      </div>
    </main>
  );
}
