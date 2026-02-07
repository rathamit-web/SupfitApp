import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '@/shared/supabaseClient';
import { AlertCircle, RotateCcw, Save } from 'lucide-react-native';

/**
 * Weight Tuning Admin Page
 * 
 * Allows administrators to adjust the weights of the 5 signals in the matching algorithm:
 * - Proximity (default 30%)
 * - Goal Alignment (default 25%)
 * - Budget Fit (default 20%)
 * - Rating (default 15%)
 * - Availability (default 10%)
 * 
 * All weight changes are:
 * - Logged to config_audit_log for compliance
 * - Updated in match_config table immediately
 * - Applied to all new matches in real-time
 */
export default function MatchWeightTuningPage() {
  // Weights state
  const [weights, setWeights] = useState({
    proximity: 30,
    goal_alignment: 25,
    budget_fit: 20,
    rating: 15,
    availability: 10,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load current weights on mount
  useEffect(() => {
    loadWeights();
  }, []);

  /**
   * Load current weights from match_config
   */
  async function loadWeights() {
    try {
      const { data, error: fetchError } = await supabase
        .from('match_config')
        .select('*')
        .eq('config_key', 'signal_weights')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found (first time)
        throw fetchError;
      }

      if (data && data.config_value) {
        setWeights(data.config_value);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading weights:', err);
      setError('Could not load weights');
      setIsLoading(false);
    }
  }

  /**
   * Validate that weights sum to 100
   */
  function validateWeights(testWeights: typeof weights): boolean {
    const total = Object.values(testWeights).reduce((sum, w) => sum + w, 0);
    return Math.abs(total - 100) < 0.1; // Allow for floating point errors
  }

  /**
   * Update individual weight
   */
  function updateWeight(signal: keyof typeof weights, value: number) {
    setWeights((prev) => ({
      ...prev,
      [signal]: Math.round(value * 10) / 10, // Round to 1 decimal
    }));
    setError(null);
    setSuccessMessage(null);
  }

  /**
   * Save weights to database
   */
  async function saveWeights() {
    // Validate weights sum to 100
    if (!validateWeights(weights)) {
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
      setError(`Weights must sum to 100% (current: ${total.toFixed(1)}%)`);
      return;
    }

    setIsSaving(true);

    try {
      // Get current user id for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update match_config
      const { error: updateError } = await supabase
        .from('match_config')
        .upsert(
          {
            config_key: 'signal_weights',
            config_value: weights,
            description: 'Signal weights for matching algorithm',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'config_key',
          }
        );

      if (updateError) throw updateError;

      // Log to config_audit_log
      const { error: auditError } = await supabase
        .from('config_audit_log')
        .insert({
          admin_id: user.id,
          config_key: 'signal_weights',
          old_value: null, // TODO: Fetch previous value
          new_value: weights,
          change_reason: 'Manual weight tuning via admin panel',
          created_at: new Date().toISOString(),
        });

      if (auditError) {
        console.warn('Could not log weight change:', auditError);
        // Don't throw - weight update was successful
      }

      setSuccessMessage(
        'Weights saved! New matches will use these weights immediately.'
      );
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving weights:', err);
      setError(err instanceof Error ? err.message : 'Could not save weights');
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Reset to default weights
   */
  function resetWeights() {
    Alert.alert(
      'Reset Weights?',
      'Reset all signal weights to defaults? This will clear current changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setWeights({
              proximity: 30,
              goal_alignment: 25,
              budget_fit: 20,
              rating: 15,
              availability: 10,
            });
            setError(null);
            setSuccessMessage(null);
          },
        },
      ]
    );
  }

  // Calculate total for display
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isValid = Math.abs(total - 100) < 0.1;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading weights...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Match Algorithm Weights</Text>
        <Text style={styles.subtitle}>
          Adjust how each signal influences match scoring
        </Text>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <AlertCircle size={16} color="#007AFF" />
        <Text style={styles.infoText}>
          Weights must total 100%. Changes apply to all new matches immediately.
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Success Message */}
      {successMessage && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Weight Sliders */}
      <View style={styles.weightSection}>
        {/* Proximity */}
        <WeightSlider
          label="📍 Proximity"
          description="Distance from user to professional"
          value={weights.proximity}
          onChange={(value) => updateWeight('proximity', value)}
          color="#34C759"
        />

        {/* Goal Alignment */}
        <WeightSlider
          label="💪 Goal Alignment"
          description="Overlap between user goals and professional specialties"
          value={weights.goal_alignment}
          onChange={(value) => updateWeight('goal_alignment', value)}
          color="#007AFF"
        />

        {/* Budget Fit */}
        <WeightSlider
          label="💵 Budget Fit"
          description="Professional price within user budget range"
          value={weights.budget_fit}
          onChange={(value) => updateWeight('budget_fit', value)}
          color="#FF9500"
        />

        {/* Rating */}
        <WeightSlider
          label="⭐ Rating"
          description="Professional star rating (0-5 stars)"
          value={weights.rating}
          onChange={(value) => updateWeight('rating', value)}
          color="#FFB800"
        />

        {/* Availability */}
        <WeightSlider
          label="📅 Availability"
          description="Whether professional has available slots"
          value={weights.availability}
          onChange={(value) => updateWeight('availability', value)}
          color="#FF6B6B"
        />
      </View>

      {/* Total Display */}
      <View style={[styles.totalBox, !isValid && styles.totalBoxError]}>
        <Text style={styles.totalLabel}>Total Weight</Text>
        <Text style={[styles.totalValue, !isValid && styles.totalValueError]}>
          {total.toFixed(1)}%
        </Text>
        {isValid ? (
          <Text style={styles.totalValid}>✓ Valid</Text>
        ) : (
          <Text style={styles.totalInvalid}>✗ Must equal 100%</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={resetWeights}
          disabled={isSaving}
        >
          <RotateCcw size={16} color="#666" />
          <Text style={styles.secondaryButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            (!isValid || isSaving) && styles.primaryButtonDisabled,
          ]}
          onPress={saveWeights}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Save size={16} color="#FFFFFF" />
          )}
          <Text style={styles.primaryButtonText}>
            {isSaving ? 'Saving...' : 'Save Weights'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Examples Section */}
      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>How Signal Weighting Works</Text>

        <ExampleBox
          title="Example 1: Proximity-Focused (Distance Matters)"
          weights={{ proximity: 50, goal_alignment: 15, budget_fit: 15, rating: 10, availability: 10 }}
          description="Best for hyper-local services where location is critical (yoga studios, gyms)"
        />

        <ExampleBox
          title="Example 2: Goal-Focused (Fit Matters)"
          weights={{ proximity: 20, goal_alignment: 40, budget_fit: 15, rating: 15, availability: 10 }}
          description="Best for specialized coaching where expertise match is crucial"
        />

        <ExampleBox
          title="Example 3: Balanced (Universal)"
          weights={{ proximity: 30, goal_alignment: 25, budget_fit: 20, rating: 15, availability: 10 }}
          description="Recommended default for general marketplace"
        />
      </View>

      {/* Debug Info */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Current Configuration</Text>
        <Text style={styles.debugInfo}>
          {JSON.stringify(weights, null, 2)}
        </Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

/**
 * Individual Weight Slider Component
 */
function WeightSlider({
  label,
  description,
  value,
  onChange,
  color,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) {
  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={styles.sliderDescription}>{description}</Text>
        </View>
        <Text style={[styles.sliderValue, { color }]}>
          {value.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.sliderTrack}>
        <Slider
          style={styles.slider}
          min={0}
          max={100}
          step={0.5}
          value={value}
          onValueChange={onChange}
          thumbTintColor={color}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#E0E0E0"
        />
      </View>
    </View>
  );
}

/**
 * Example Weight Configuration
 */
function ExampleBox({
  title,
  weights,
  description,
}: {
  title: string;
  weights: Record<string, number>;
  description: string;
}) {
  return (
    <View style={styles.exampleBox}>
      <Text style={styles.exampleTitle}>{title}</Text>
      <Text style={styles.exampleDescription}>{description}</Text>
      <View style={styles.exampleWeights}>
        {Object.entries(weights).map(([signal, weight]) => (
          <View key={signal} style={styles.exampleWeightRow}>
            <Text style={styles.exampleWeightLabel}>
              {signal.replace('_', ' ')}
            </Text>
            <Text style={styles.exampleWeightValue}>{weight}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },

  // Center
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 4,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#007AFF',
    flex: 1,
  },

  // Error Box
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 4,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    flex: 1,
  },

  // Success Box
  successBox: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 4,
  },
  successText: {
    fontSize: 12,
    color: '#34C759',
  },

  // Weight Section
  weightSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sliderDescription: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sliderTrack: {
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },

  // Total Box
  totalBox: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  totalBoxError: {
    borderColor: '#FF6B6B',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#34C759',
  },
  totalValueError: {
    color: '#FF6B6B',
  },
  totalValid: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 4,
  },
  totalInvalid: {
    fontSize: 11,
    color: '#FF6B6B',
    marginTop: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },

  // Examples Section
  examplesSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  exampleDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  exampleWeights: {
    gap: 4,
  },
  exampleWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exampleWeightLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
  },
  exampleWeightValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },

  // Debug Section
  debugSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  debugInfo: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Courier New',
  },
});

export default MatchWeightTuningPage;
