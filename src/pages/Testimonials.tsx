import { useState } from 'react';
import { Home, Wallet, User, MessageCircle } from 'lucide-react';
import CoachFooter from '@/components/CoachFooter';
import { colors, typography } from '../lib/designSystem';
// Footer replaced with inline navigation below


const initialTestimonials = [
  {
    id: 1,
    trainee: 'Amit S.',
    coach: 'John Martinez',
    text: 'John helped me gain strength and confidence. His plans are easy to follow and effective!',
    date: '2025-12-10',
    stars: 5,
    visible: true,
    replied: false,
    reply: '',
  },
  {
    id: 2,
    trainee: 'Priya R.',
    coach: 'John Martinez',
    text: 'I lost 10kg in 3 months with John’s guidance. Highly recommended!',
    date: '2025-12-09',
    stars: 4,
    visible: false,
    replied: true,
    reply: 'Thank you Priya! Keep up the great work! 💪',
  },
  {
    id: 3,
    trainee: 'Megha T.',
    coach: 'Sarah Chen',
    text: 'Sarah’s yoga sessions brought peace and flexibility to my life.',
    date: '2025-12-08',
    stars: 5,
    visible: true,
    replied: false,
    reply: '',
  },
];

const glassStyle = {
  background: 'rgba(255,255,255,0.7)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  borderRadius: '24px',
  border: '1.5px solid rgba(255,255,255,0.25)',
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  // Sort testimonials by date descending (most recent first)
  const sortedTestimonials = [...testimonials].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const pendingReplies = testimonials.filter(t => !t.replied).length;
  const [replyingId, setReplyingId] = useState<number|null>(null);
  const [replyText, setReplyText] = useState('');

  const handlePublishToggle = (id: number) => {
    setTestimonials((prev) => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const handleReply = (id: number) => {
    setTestimonials((prev) => prev.map(t => t.id === id ? { ...t, replied: true, reply: replyText } : t));
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(135deg, #f8fafc 0%, #f5f5f7 100%)' }}>
      <main
        style={{
          padding: '40px 0 100px',
          fontFamily: '-apple-system,BlinkMacSystemFont,\'SF Pro Display\',\'SF Pro Text\',Roboto,Google Sans,Helvetica Neue,Arial,sans-serif',
          letterSpacing: '-0.24px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          {/* Notification Icon */}
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {pendingReplies > 0 && (
              <span style={{ background: '#ff3c20', color: '#fff', borderRadius: '12px', padding: '2px 10px', fontWeight: 700, fontSize: 15 }}>{pendingReplies}</span>
            )}
          </div>
          <h1
            style={{
              fontSize: typography.fontSize['4xl'], // Reduced size
              fontWeight: typography.fontWeight.extrabold,
              letterSpacing: typography.letterSpacing.tight,
              color: colors.primary, // Supfit logo color
              marginBottom: 8,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Manage Feedback
          </h1>
          <p style={{ fontSize: 18, color: '#6e6e73', fontWeight: 500, marginBottom: 32 }}>Review, reply, and publish feedback from your trainees.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sortedTestimonials.length === 0 && (
              <div style={{ ...glassStyle, padding: 40, textAlign: 'center', color: '#6e6e73', fontSize: 18 }}>No feedback yet.</div>
            )}
            {sortedTestimonials.map((t) => (
              <div key={t.id} style={{ ...glassStyle, padding: 32, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#ff3c20' }}>{t.trainee}</div>
                  <span style={{ fontSize: 13, color: '#6e6e73', fontWeight: 500 }}>for <b>{t.coach}</b></span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, color: '#b0b0b5' }}>{t.date || '\u2014'}</span>
                </div>
                {/* Stars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>{Array.from({ length: t.stars }).map((_, i) => (
                    <svg key={`${t.id}-star-${i}`} width="22" height="22" viewBox="0 0 24 24" fill="#FFD600" stroke="#FFD600" strokeWidth="1.5" style={{ marginRight: 2 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ))}</span>
                </div>
                {/* Written Feedback */}
                <div style={{ fontSize: 17, color: '#1d1d1f', fontWeight: 500, lineHeight: 1.5 }}>{t.text}</div>
                {t.reply && (
                  <div style={{ background: 'rgba(255,60,32,0.08)', borderRadius: 12, padding: 16, marginTop: 4, color: '#ff3c20', fontSize: 15, fontStyle: 'italic' }}>
                    <b>Coach Reply:</b> {t.reply}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => handlePublishToggle(t.id)}
                    style={{
                      background: t.visible ? 'rgba(52,199,89,0.12)' : 'rgba(255,60,32,0.12)',
                      color: t.visible ? '#34c759' : '#ff3c20',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 18px',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: t.visible ? '0 2px 8px rgba(52,199,89,0.08)' : '0 2px 8px rgba(255,60,32,0.08)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t.visible ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => setReplyingId(t.id)}
                    style={{
                      background: 'rgba(96,165,250,0.12)',
                      color: '#1d4ed8',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 18px',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(96,165,250,0.08)',
                      transition: 'all 0.2s',
                    }}
                    disabled={t.replied}
                  >
                    {t.replied ? 'Replied' : 'Reply'}
                  </button>
                </div>
                {replyingId === t.id && !t.replied && (
                  <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        fontSize: 15,
                      }}
                    />
                    <button
                      onClick={() => handleReply(t.id)}
                      style={{
                        background: '#ff3c20',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 18px',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(255,60,32,0.18)',
                        transition: 'all 0.2s',
                      }}
                      disabled={!replyText.trim()}
                    >
                      Send
                    </button>
                    <button
                      onClick={() => { setReplyingId(null); setReplyText(''); }}
                      style={{
                        background: 'rgba(0,0,0,0.04)',
                        color: '#1d1d1f',
                        border: 'none',
                        borderRadius: 10,
                        padding: '8px 14px',
                        fontWeight: 500,
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      {/* Add bottom padding to prevent content overlap with fixed footer */}
      <div style={{ height: '65px' }} />
      <CoachFooter />
    </div>
  );
};

export default Testimonials;
