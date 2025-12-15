import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius } from '@/lib/designSystem';
import { useNavigate } from 'react-router-dom';

  // Use Supfit logo color for all icons
  const supfitColor = '#ff3c20';
  const faceOptions = [
    {
      label: 'Very Bad',
      value: 1,
      color: supfitColor,
      svg: (
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill={supfitColor} fillOpacity="0.18" />
          <path d="M11 13 l2 2 M13 13 l-2 2" stroke={supfitColor} strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M19 13 l2 2 M21 13 l-2 2" stroke={supfitColor} strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M12 22c2-2 6-2 8 0" stroke={supfitColor} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Bad',
      value: 2,
      color: supfitColor,
      svg: (
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill={supfitColor} fillOpacity="0.18" />
          <circle cx="12.5" cy="14" r="1.5" fill={supfitColor} />
          <circle cx="19.5" cy="14" r="1.5" fill={supfitColor} />
          <path d="M12 22c2-2 6-2 8 0" stroke={supfitColor} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Okay',
      value: 3,
      color: supfitColor,
      svg: (
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill={supfitColor} fillOpacity="0.18" />
          <circle cx="12.5" cy="14" r="1.5" fill={supfitColor} />
          <circle cx="19.5" cy="14" r="1.5" fill={supfitColor} />
          <rect x="12" y="21" width="8" height="2" rx="1" fill={supfitColor} />
        </svg>
      ),
    },
    {
      label: 'Good',
      value: 4,
      color: supfitColor,
      svg: (
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill={supfitColor} fillOpacity="0.18" />
          <circle cx="12.5" cy="14" r="1.5" fill={supfitColor} />
          <circle cx="19.5" cy="14" r="1.5" fill={supfitColor} />
          <path d="M12 20c2 2 6 2 8 0" stroke={supfitColor} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

const Feedback = () => {
  const [rating, setRating] = useState(5);
  const [emoji, setEmoji] = useState(4);
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Feedback submission logic placeholder (no backend)
    navigate('/home');
  };

  // Apple-specific icons as SVGs for liquid glass effect

  return (
    <main style={{ gap: spacing[20] }}>
       <h1 style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.extrabold, color: '#ff3c20', marginBottom: spacing[8] }}>
         Feedback
       </h1>
      <form onSubmit={handleSubmit}>
        {/* Rate your coach */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderRadius: borderRadius.xl,
          border: '1px solid #ececec',
          padding: spacing[16],
          marginBottom: spacing[4],
        }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[12] }}>
            Rate your coach
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
             {[1,2,3,4,5].map((star) => (
               <button
                 key={star}
                 type="button"
                 onClick={() => setRating(star)}
                 style={{
                   fontSize: 32,
                   color: star <= rating ? '#FFD600' : '#e0e0e0',
                   cursor: 'pointer',
                   transition: 'color 0.2s',
                   filter: 'drop-shadow(0 2px 8px rgba(255,214,0,0.12))',
                   background: 'none',
                   border: 'none',
                   outline: 'none',
                   padding: 0,
                 }}
                 aria-label={star + ' star'}
               >★</button>
             ))}
          </div>
        </div>
        {/* Emoji feedback */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderRadius: borderRadius.xl,
          border: '1px solid #ececec',
          padding: spacing[16],
          marginBottom: spacing[4],
        }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[12] }}>
            Tell us how you feel about your session
          </div>
           <div style={{ display: 'flex', gap: 18 }}>
             {faceOptions.map((opt) => (
               <button
                 key={opt.value}
                 type="button"
                 onClick={() => setEmoji(opt.value)}
                 style={{
                   width: 48,
                   height: 48,
                   display: 'inline-flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '50%',
                   background: emoji === opt.value ? supfitColor + '22' : 'rgba(255,255,255,0.35)',
                   boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
                   backdropFilter: 'blur(16px)',
                   WebkitBackdropFilter: 'blur(16px)',
                   border: emoji === opt.value ? '2px solid ' + supfitColor : '1.5px solid rgba(255,255,255,0.5)',
                   cursor: 'pointer',
                   transition: 'all 0.2s',
                   outline: 'none',
                   padding: 0,
                 }}
                 aria-label={opt.label}
               >
                 {opt.svg}
               </button>
             ))}
          </div>
        </div>
        {/* Text feedback */}
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          borderRadius: borderRadius.xl,
          border: '1px solid #ececec',
          padding: spacing[16],
        }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[8] }}>
            Tell us what you loved or what could be better...
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="I appreciated the new drills! Would love more strength work in the next few months."
            style={{
              width: '100%',
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.system,
              borderRadius: borderRadius.lg,
              border: '1px solid #e0e7ef',
              padding: spacing[12],
              background: 'rgba(255,255,255,0.9)',
              color: colors.text.primary,
              resize: 'vertical',
              marginTop: 4,
            }}
            required
          />
        </div>
         <button
           type="submit"
           style={{
             width: 'auto',
             marginTop: spacing[8],
             background: '#ff3c20',
             color: '#fff',
             fontWeight: 700,
             fontSize: typography.fontSize.base,
             border: 'none',
             borderRadius: borderRadius.xl,
             padding: '10px 24px',
             boxShadow: '0 4px 16px rgba(255,60,32,0.12)',
             cursor: 'pointer',
             letterSpacing: '-0.5px',
             transition: 'all 0.2s',
             fontFamily: typography.fontFamily.system,
             display: 'block',
             marginLeft: 'auto',
             marginRight: 'auto',
           }}
         >
           Submit Feedback
         </button>
      </form>
    </main>
  );
};

export default Feedback;
