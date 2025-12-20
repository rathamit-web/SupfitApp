
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import supfitLogo from '../assets/Supfitlogo.png';

type Props = {
  formData: {
    height: string;
    heightUnit: string;
    weight: string;
    weightUnit: string;
  };
  onChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const heightUnits = [
  { label: 'cm', value: 'cm' },
  { label: 'ft', value: 'ft' },
];
const weightUnits = [
  { label: 'kg', value: 'kg' },
  { label: 'lbs', value: 'lbs' },
];

const CreateProfileStep2 = ({ formData, onChange, onNext, onBack }: Props) => {
  return (
    <>
      {/* ...removed logo, header, and step indicator... */}
      {/* Title & Subtitle */}
      <h2 style={{ color: '#ff3c20', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>A Little About You</h2>
      <p style={{ color: '#666', fontSize: 16, marginBottom: 28 }}>This helps us tailor recommendations and connect you with the right clients.</p>
      {/* Height */}
      <div style={{ marginBottom: 18 }}>
        <Label htmlFor="height" style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>Height</Label>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 12 }}>
          {heightUnits.map(u => (
            <button
              key={u.value}
              type="button"
              onClick={() => onChange('heightUnit', u.value)}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: formData.heightUnit === u.value ? '2px solid #ff3c20' : '1px solid #eee',
                background: formData.heightUnit === u.value ? '#ff3c20' : '#fff6f3',
                color: formData.heightUnit === u.value ? '#fff' : '#ff3c20',
                fontWeight: 700,
                fontSize: 17,
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
        <Input
          id="height"
          type="number"
          value={formData.height || ''}
          onChange={e => onChange('height', e.target.value)}
          placeholder={`Enter height in ${formData.heightUnit || 'cm'}`}
          style={{ fontSize: 18, padding: '16px', borderRadius: 12, background: '#fafafa', border: '1px solid #eee' }}
        />
        {/* Weight Unit Toggle */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 12 }}>
          {weightUnits.map(u => (
            <button
              key={u.value}
              type="button"
              onClick={() => onChange('weightUnit', u.value)}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: formData.weightUnit === u.value ? '2px solid #ff3c20' : '1px solid #eee',
                background: formData.weightUnit === u.value ? '#ff3c20' : '#fff6f3',
                color: formData.weightUnit === u.value ? '#fff' : '#ff3c20',
                fontWeight: 700,
                fontSize: 17,
                cursor: 'pointer',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
        <Input
          id="weight"
          type="number"
          value={formData.weight || ''}
          onChange={e => onChange('weight', e.target.value)}
          placeholder={`Enter weight in ${formData.weightUnit || 'kg'}`}
          style={{ fontSize: 18, padding: '16px', borderRadius: 12, background: '#fafafa', border: '1px solid #eee' }}
          required
        />
      </div>
      {/* Back/Next Buttons */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        <Button
          type="button"
          style={{
            flex: 1,
            background: '#fff6f3',
            color: '#ff3c20',
            fontWeight: 700,
            fontSize: 20,
            borderRadius: 16,
            padding: '16px 0',
            border: 'none',
          }}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          style={{
            flex: 1,
            background: '#ff3c20',
            color: '#fff',
            fontWeight: 700,
            fontSize: 20,
            borderRadius: 16,
            padding: '16px 0',
            border: 'none',
          }}
          onClick={onNext}
          disabled={!formData.height || !formData.weight}
        >
          Next
        </Button>
      </div>
    </>
  );
};

export default CreateProfileStep2;
