


import { Button } from '@/components/ui/button';

interface Props {
  readonly onSubmit: () => void;
}

export default function CreateProfileStep3({ onSubmit }: Props) {
  return (
    <div
      className="w-full flex items-start justify-center px-[env(safe-area-inset-left,1vw)] py-0"
      style={{
        fontFamily: 'SF Pro Display, SF Pro Text, Roboto, Arial, sans-serif',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f5d0fe 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 'unset',
        height: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 370,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: 'auto',
        }}
      >
        <h2 style={{ color: '#ff3c20', fontWeight: 800, fontSize: 22, marginBottom: 12, marginTop: 0, textAlign: 'center' }}>
          User Data Consent & Privacy Notice
        </h2>
        <div style={{ fontStyle: 'italic', color: '#ff3c20', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
          “Your data, your control — always secure.”
        </div>
        <div style={{ marginBottom: 16, textAlign: 'left', color: '#444', fontSize: 15, width: '100%' }}>
          <div style={{ marginBottom: 10 }}>
            By continuing, I agree that:
          </div>
          <ul style={{ paddingLeft: 18, marginBottom: 10 }}>
            <li style={{ marginBottom: 6 }}>My health, personal, and smartwatch data will be used only for tracking and analysis.</li>
            <li style={{ marginBottom: 6 }}>My information will not be shared or sold, except as required by law.</li>
            <li style={{ marginBottom: 6 }}>The app follows HIPAA and data protection standards to keep my information secure.</li>
            <li style={{ marginBottom: 6 }}>I may withdraw consent or request deletion of my data at any time.</li>
          </ul>
          <div style={{ color: '#ff3c20', fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>☑️</span>I have read and consent to the collection and use of my data as described.
          </div>
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          style={{
            width: '100%',
            maxWidth: 220,
            fontWeight: 700,
            fontSize: 16,
            borderRadius: '16px',
            background: 'linear-gradient(90deg, #ff3c20 0%, #ff6a3c 100%)',
            color: '#fff',
            boxShadow: '0 6px 24px 0 rgba(255,60,32,0.18)',
            padding: '12px 0',
            marginTop: 24,
            marginBottom: 32,
            letterSpacing: '-0.2px',
            transition: 'all 0.2s',
            minHeight: 44,
            alignSelf: 'center',
            border: 'none',
            outline: 'none',
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
