import { anonymizeHealthData } from '../aiPlanGenerator';

describe('anonymizeHealthData', () => {
  it('converts BMI to category and age to range without leaking raw values', () => {
    const result = anonymizeHealthData({
      bmi: 29.1,
      weight: 82,
      height: 170,
      age: 44,
      chronicConditions: ['Hypertension', 'Unknown'],
      medications: 'Lisinopril for blood pressure',
      allergies: '',
    });

    expect(result.bmiCategory).toBe('overweight');
    expect(result.ageRange).toBe('36-45');
    expect(result.hasConditions).toEqual(['hypertension']);
    expect(result.medicationTypes).toContain('blood_pressure');
  });

  it('handles missing values gracefully', () => {
    const result = anonymizeHealthData({
      bmi: null,
      weight: null,
      height: null,
      age: null,
      chronicConditions: [],
      medications: '',
      allergies: '',
    });

    expect(result.bmiCategory).toBe('normal');
    expect(result.ageRange).toBe('26-35');
    expect(result.hasConditions).toEqual([]);
    expect(result.medicationTypes).toEqual([]);
  });
});
