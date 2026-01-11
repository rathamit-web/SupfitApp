
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { supabase } from '../lib/supabaseClient';
import { ENABLE_PURPOSED_VITALS, DEFAULT_VITAL_PURPOSE } from '../config/privacy';
import { auditEvent } from '../lib/audit';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Polyline, Line, Circle } from 'react-native-svg';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import FooterNav from '../components/FooterNav';





// Real-Time Vitals data
const vitals = [
  {
    key: 'heartRate',
    label: 'Heart Rate',
    value: 72,
    unit: 'BPM',
    color: '#FF3B30',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [20, 18, 22, 15, 19, 17, 23, 20],
    icon: <MaterialIcons name="favorite" size={22} color="#FF3B30" />,
  },
  {
    key: 'bp',
    label: 'Blood Pressure',
    value: '120/80',
    unit: 'mmHg',
    color: '#007AFF',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [15, 16, 14, 15, 16, 14, 15, 15],
    icon: <Feather name="activity" size={22} color="#007AFF" />,
  },
  {
    key: 'bloodSugar',
    label: 'Blood Sugar',
    value: 95,
    unit: 'mg/dL',
    color: '#FF9500',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [18, 20, 17, 19, 18, 21, 19, 20],
    icon: <Feather name="droplet" size={22} color="#FF9500" />,
  },
  {
    key: 'spo2',
    label: 'SpO2',
    value: 98,
    unit: '%',
    color: '#22D3EE',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [8, 7, 9, 8, 7, 9, 8, 7],
    icon: <Feather name="wind" size={22} color="#22D3EE" />,
  },
  {
    key: 'temp',
    label: 'Temperature',
    value: 36.5,
    unit: '°C',
    color: '#C084FC',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [15, 16, 15, 17, 16, 15, 16, 15],
    icon: <Feather name="thermometer" size={22} color="#C084FC" />,
  },
  {
    key: 'hydration',
    label: 'Hydration',
    value: 2.1,
    unit: 'L',
    color: '#007AFF',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [12, 10, 15, 13, 18, 16, 20, 18],
    icon: <Feather name="droplet" size={22} color="#007AFF" />,
  },
  {
    key: 'sleep',
    label: 'Sleep Quality',
    value: 8.2,
    unit: 'hrs',
    color: '#818CF8',
    status: 'Good',
    statusColor: '#34C759',
    spark: [10, 12, 11, 15, 13, 14, 12, 13],
    icon: <Feather name="moon" size={22} color="#818CF8" />,
  },
  {
    key: 'stress',
    label: 'Stress Level',
    value: 'Low',
    unit: '',
    color: '#FF9500',
    status: 'Normal',
    statusColor: '#34C759',
    spark: [30, 40, 35, 30, 25, 30, 28, 30],
    icon: <Feather name="activity" size={22} color="#FF9500" />,
  },
];


// Type alias for period
type TrendPeriod = 'Weekly' | 'Monthly' | 'Yearly';
// Helper to get start date for period
function getStartDate(period: TrendPeriod) {
  const now = new Date();
  if (period === 'Weekly') {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    return d;
  } else if (period === 'Monthly') {
    const d = new Date(now);
    d.setDate(now.getDate() - 27);
    return d;
  } else {
    const d = new Date(now);
    d.setFullYear(now.getFullYear() - 1);
    return d;
  }
}

const vitalOptions = [
  { key: 'bp', label: 'Blood Pressure', color: '#007AFF' },
  { key: 'bloodSugar', label: 'Blood Sugar', color: '#FF9500' },
];
const periodOptions = ['Weekly', 'Monthly', 'Yearly'];



const HealthDashboard = ({ navigation }: any) => {
  const [selectedVital, setSelectedVital] = useState<'bp' | 'bloodSugar'>('bp');
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriod>('Weekly');
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch manual vitals from Supabase and aggregate for chart
  useEffect(() => {
    let isMounted = true;
    async function fetchTrendData() {
      setLoading(true);
      setError(null);
      try {
        // Get user id
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) throw new Error('User not logged in');
        // Map vital key to type
        const vitalType = selectedVital === 'bp' ? 'Blood Pressure' : 'Blood Sugar';
        // Get start date for period
        const startDate = getStartDate(selectedPeriod);
        // Query manual_vitals for this user, type, and date >= startDate
        let query = supabase
          .from('manual_vitals')
          .select('*')
          .eq('user_id', user_id)
          .eq('type', vitalType)
          .gte('date', startDate.toISOString().slice(0, 10))
          .order('date', { ascending: true });

        if (ENABLE_PURPOSED_VITALS) {
          query = query.eq('purpose', DEFAULT_VITAL_PURPOSE);
        }

        const { data, error } = await query;
        if (!error) {
          await auditEvent({
            action: 'read',
            table: 'manual_vitals',
            userId: user_id,
            purpose: ENABLE_PURPOSED_VITALS ? DEFAULT_VITAL_PURPOSE : undefined,
          });
        }
        if (error) throw error;
        // Build time buckets
        let buckets: (number | undefined)[] = [];
        if (selectedPeriod === 'Weekly') {
          buckets = new Array(7).fill(undefined);
          for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const dayStr = day.toISOString().slice(0, 10);
            const entries = (data || []).filter((v: any) => v.date === dayStr);
            if (entries.length > 0) {
              if (selectedVital === 'bp') {
                const systolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[0], 10)).filter(Boolean);
                const diastolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[1], 10)).filter(Boolean);
                const avgSys = systolics.length ? Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length) : undefined;
                const avgDia = diastolics.length ? Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length) : undefined;
                buckets[i] = avgSys !== undefined && avgDia !== undefined ? Number.parseFloat(`${avgSys}.${avgDia}`) : undefined;
              } else {
                const vals = entries.map((v: any) => Number.parseFloat(v.value)).filter(Boolean);
                buckets[i] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : undefined;
              }
            } else {
              buckets[i] = undefined;
            }
          }
        } else if (selectedPeriod === 'Monthly') {
          buckets = new Array(28).fill(undefined);
          for (let i = 0; i < 28; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const dayStr = day.toISOString().slice(0, 10);
            const entries = (data || []).filter((v: any) => v.date === dayStr);
            if (entries.length > 0) {
              if (selectedVital === 'bp') {
                const systolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[0], 10)).filter(Boolean);
                const diastolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[1], 10)).filter(Boolean);
                const avgSys = systolics.length ? Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length) : undefined;
                const avgDia = diastolics.length ? Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length) : undefined;
                buckets[i] = avgSys !== undefined && avgDia !== undefined ? Number.parseFloat(`${avgSys}.${avgDia}`) : undefined;
              } else {
                const vals = entries.map((v: any) => Number.parseFloat(v.value)).filter(Boolean);
                buckets[i] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : undefined;
              }
            } else {
              buckets[i] = undefined;
            }
          }
        } else {
          buckets = new Array(12).fill(undefined);
          for (let i = 0; i < 12; i++) {
            const month = new Date(startDate);
            month.setMonth(startDate.getMonth() + i);
            const monthStr = month.toISOString().slice(0, 7); // YYYY-MM
            const entries = (data || []).filter((v: any) => (v.date || '').slice(0, 7) === monthStr);
            if (entries.length > 0) {
              if (selectedVital === 'bp') {
                const systolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[0], 10)).filter(Boolean);
                const diastolics = entries.map((v: any) => Number.parseInt((v.value || '').split('/')[1], 10)).filter(Boolean);
                const avgSys = systolics.length ? Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length) : undefined;
                const avgDia = diastolics.length ? Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length) : undefined;
                buckets[i] = avgSys !== undefined && avgDia !== undefined ? Number.parseFloat(`${avgSys}.${avgDia}`) : undefined;
              } else {
                const vals = entries.map((v: any) => Number.parseFloat(v.value)).filter(Boolean);
                buckets[i] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : undefined;
              }
            } else {
              buckets[i] = undefined;
            }
          }
        }
        // Fill missing with previous or 0, ensure number[]
        const filled: number[] = buckets.map((v, i) => {
          if (typeof v === 'number' && !Number.isNaN(v)) return v;
          if (i > 0 && typeof buckets[i - 1] === 'number') return buckets[i - 1] as number;
          return 0;
        });
        if (isMounted) setChartData(filled);
      } catch (e: any) {
        if (isMounted) setError(e.message || 'Failed to fetch data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTrendData();
    return () => { isMounted = false; };
  }, [selectedVital, selectedPeriod]);

  const chartColor = vitalOptions.find(v => v.key === selectedVital)?.color || '#22D3EE';
  // Calculate chart points
  const chartPoints = chartData.map((y: number, i: number) => {
    const x = (i * 300) / (chartData.length - 1);
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;
    const yVal = 90 - ((y - min) / range) * 70;
    return `${x},${yVal}`;
  }).join(' ');

  return (
    <LinearGradient colors={["#fafafa", "#f5f5f7"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          {/* Real-Time Vitals */}
          <Text style={styles.sectionTitle}>Real-Time Vitals</Text>
          <View style={styles.vitalsGrid}>
            {vitals.map((vital) => (
              <View key={vital.key} style={styles.vitalCard}>
                <View style={styles.vitalHeader}>
                  {vital.icon}
                  <Text style={styles.vitalLabel}>{vital.label}</Text>
                </View>
                <Text style={styles.vitalValue}>
                  {vital.value} <Text style={styles.vitalUnit}>{vital.unit}</Text>
                </Text>
                {/* Sparkline */}
                <Svg height="32" width="100%" viewBox="0 0 100 32" style={{ marginTop: 8 }}>
                  <Polyline
                    points={vital.spark.map((y: number, i: number) => `${(i * 100) / (vital.spark.length - 1)},${32 - y}`).join(' ')}
                    fill="none"
                    stroke={vital.color}
                    strokeWidth="2"
                  />
                </Svg>
                <View style={[styles.statusBadge, { backgroundColor: vital.statusColor + '22' }] }>
                  <Text style={[styles.statusText, { color: vital.statusColor }]}>{vital.status}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Trend Analysis */}
          <Text style={styles.sectionTitle}>Trend Analysis</Text>
          <View style={[styles.trendCard, styles.trendGlass]}> 
            {/* Modern pill-style toggle for period selection */}
            <View style={styles.periodToggleRow}>
              <View style={styles.periodToggleContainer}>
                {periodOptions.map((period, idx) => {
                  const isActive = selectedPeriod === period;
                  return (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.periodToggleBtn,
                        isActive && styles.periodToggleBtnActive,
                        idx === 0 && styles.periodToggleBtnFirst,
                        idx === periodOptions.length - 1 && styles.periodToggleBtnLast,
                      ]}
                      onPress={() => setSelectedPeriod(period as 'Weekly' | 'Monthly' | 'Yearly')}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.periodToggleBtnText, isActive && styles.periodToggleBtnTextActive]}>{period}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* Vital selection: only BP and Blood Sugar */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 8 }}>
              {vitalOptions.map(vital => (
                <TouchableOpacity
                  key={vital.key}
                  style={{
                    backgroundColor: selectedVital === vital.key ? vital.color : 'rgba(255,255,255,0.5)',
                    borderRadius: 16,
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    marginHorizontal: 4,
                    shadowColor: selectedVital === vital.key ? vital.color : 'transparent',
                    shadowOpacity: selectedVital === vital.key ? 0.18 : 0,
                    shadowRadius: 8,
                    elevation: selectedVital === vital.key ? 2 : 0,
                  }}
                  onPress={() => setSelectedVital(vital.key as 'bp' | 'bloodSugar')}
                  activeOpacity={0.9}
                >
                  <Text style={{ color: selectedVital === vital.key ? '#fff' : '#6e6e73', fontWeight: '700', fontSize: 15, letterSpacing: -0.2 }}>{vital.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
              {/* Apple-style animated line chart for selected vital/period */}
              <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
                {loading ? (
                  <Text style={{ color: '#6e6e73', fontSize: 16, marginVertical: 24 }}>Loading...</Text>
                ) : error ? (
                  <Text style={{ color: '#ff3c20', fontSize: 16, marginVertical: 24 }}>{error}</Text>
                ) : (
                  <>
                    <Svg width={300} height={110} viewBox="0 0 300 110">
                      {/* Grid lines */}
                      {new Array(5).fill(0).map((_, i) => (
                        <Line
                          key={`grid-${i}`}
                          x1={0}
                          y1={20 + i * 20}
                          x2={300}
                          y2={20 + i * 20}
                          stroke="#e5e5ea"
                          strokeWidth={1}
                        />
                      ))}
                      {/* Data polyline */}
                      <Polyline
                        points={chartPoints}
                        fill="none"
                        stroke={chartColor}
                        strokeWidth={3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* Data points */}
                      {chartData.map((y: number, i: number) => {
                        const x = (i * 300) / (chartData.length - 1);
                        const min = Math.min(...chartData);
                        const max = Math.max(...chartData);
                        const range = max - min || 1;
                        const yVal = 90 - ((y - min) / range) * 70;
                        return (
                          <Circle
                            key={`pt-${selectedVital}-${selectedPeriod}-${i}`}
                            cx={x}
                            cy={yVal}
                            r={4}
                            fill="#fff"
                            stroke={chartColor}
                            strokeWidth={2}
                          />
                        );
                      })}
                    </Svg>
                    {/* Axis labels */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 300, marginTop: 2 }}>
                      <Text style={{ fontSize: 11, color: '#8A8A8E' }}>Start</Text>
                      <Text style={{ fontSize: 11, color: '#8A8A8E' }}>Now</Text>
                    </View>
                  </>
                )}
              </View>
              {/* Value range display */}
              {!loading && !error && chartData.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 300, alignSelf: 'center', marginBottom: 2 }}>
                  <Text style={{ fontSize: 12, color: '#8A8A8E' }}>Min: {Math.min(...chartData)}</Text>
                  <Text style={{ fontSize: 12, color: '#8A8A8E' }}>Max: {Math.max(...chartData)}</Text>
                </View>
              )}
          </View>

          {/* Anomaly Section (Blood Pressure) */}
          <View style={styles.anomalyRow}>
            <View style={{ flex: 2, gap: 12 }}>
              <View style={[styles.anomalyCard, { borderColor: '#FF9F0A' }] }>
                <Text style={[styles.anomalyTitle, { color: '#FF9F0A' }]}>Blood Pressure</Text>
                <Text style={styles.anomalyConfidence}>88% Confidence</Text>
                <Text style={styles.anomalyDesc}>Elevated blood pressure detected during lunch. Recurring pattern over 5 days.</Text>
                <Text style={styles.anomalyTime}>Detected on March 11 at 2:45 PM</Text>
                <Text style={styles.anomalyRec}><Text style={{ fontWeight: '700', color: '#FF9500' }}>Recommendation:</Text> Monitor sodium intake during lunch, recurring pattern over last 5 days.</Text>
              </View>
            </View>
          </View>

          {/* Anomaly Section (Heart Rate) */}
          <View style={styles.anomalyRow}>
            <View style={{ flex: 2, gap: 12 }}>
              <View style={[styles.anomalyCard, { borderColor: '#FF3B30' }] }>
                <Text style={[styles.anomalyTitle, { color: '#FF3B30' }]}>Heart Rate</Text>
                <Text style={styles.anomalyConfidence}>95% Confidence</Text>
                <Text style={styles.anomalyDesc}>Unusual heart rate elevation detected during typical rest period.</Text>
                <Text style={styles.anomalyTime}>Detected on March 12 at 3:15 PM</Text>
                <Text style={styles.anomalyRec}><Text style={{ fontWeight: '700', color: '#FF3B30' }}>Recommendation:</Text> Ensure adequate hydration and consider stress management techniques.</Text>
              </View>
            </View>
          </View>

          {/* Heatmap Section (moved after Heart Rate) */}
          <View style={styles.anomalyRow}>
            <View style={styles.heatmapCard}>
              <Text style={styles.heatmapTitle}>Anomaly Heatmap</Text>
              <View style={styles.heatmapGrid}>
                {new Array(28).fill(0).map((_, i) => {
                  let cellStyle = styles.heatmapCellGreen;
                  if (i === 10 || i === 18 || i === 25) cellStyle = styles.heatmapCellOrange;
                  else if (i === 16 || i === 24) cellStyle = styles.heatmapCellYellow;
                  return <View key={`heatmap-cell-${i + 1}`} style={[styles.heatmapCell, cellStyle]} />;
                })}
              </View>
              <View style={styles.heatmapLegendRow}>
                <Text style={styles.heatmapLegend}>Less</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={styles.heatmapCellGreen} />
                  <View style={styles.heatmapCellYellow} />
                  <View style={styles.heatmapCellOrange} />
                </View>
                <Text style={styles.heatmapLegend}>More</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Modern Glassmorphic Footer */}
      <FooterNav />
    </LinearGradient>
  );
};

// Footer styles (copied from IndividualUserHome)
const footerStyles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.92)',
    borderTopWidth: 0.5,
    borderColor: '#e5e5ea',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -4px 12px rgba(0,0,0,0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }),
    marginBottom: 16,
  },
  iconBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  iconBtnActive: {
    backgroundColor: 'rgba(255,60,32,0.08)',
  },
  iconShadow: {
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

const styles = StyleSheet.create({
  container: { padding: 0, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.85)', borderBottomWidth: 0.5, borderColor: '#e5e5ea' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#2c2c2e' },
  headerSubtitle: { fontSize: 13, color: '#8A8A8E', marginTop: 2 },
  headerTime: { fontSize: 12, color: '#8A8A8E' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#2c2c2e', marginTop: 28, marginBottom: 12, marginLeft: 20 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 },
  vitalCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8 },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  vitalLabel: { fontSize: 14, fontWeight: '600', color: '#2c2c2e', marginLeft: 6 },
  vitalValue: { fontSize: 28, fontWeight: '700', color: '#2c2c2e', marginTop: 2 },
  vitalUnit: { fontSize: 15, color: '#8A8A8E', fontWeight: '500' },
  statusBadge: { alignSelf: 'flex-start', marginTop: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 12, fontWeight: '600' },
  trendCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 18, padding: 20, marginHorizontal: 16, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  trendGlass: { shadowColor: '#fff', shadowOpacity: 0.18, shadowRadius: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', borderRadius: 22 },
  periodToggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  periodToggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(240,240,245,0.7)', borderRadius: 16, padding: 4 },
  periodToggleBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14, marginHorizontal: 2 },
  periodToggleBtnActive: { backgroundColor: '#22223b' },
  periodToggleBtnFirst: { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  periodToggleBtnLast: { borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  periodToggleBtnText: { fontSize: 14, color: '#6e6e73', fontWeight: '600' },
  periodToggleBtnTextActive: { color: '#fff', fontWeight: '700' },
  anomalyRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 24 },
  anomalyCard: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1 },
  anomalyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  anomalyConfidence: { fontSize: 12, color: '#8A8A8E', marginBottom: 6 },
  anomalyDesc: { fontSize: 13, color: '#8A8A8E', marginBottom: 4 },
  anomalyTime: { fontSize: 11, color: '#8A8A8E', marginBottom: 4 },
  anomalyRec: { fontSize: 12, color: '#8A8A8E' },
  heatmapCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', alignItems: 'center', marginLeft: 8 },
  heatmapTitle: { fontSize: 15, fontWeight: '700', color: '#2c2c2e', marginBottom: 8 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 84, marginBottom: 8 },
  heatmapCell: { width: 12, height: 12, borderRadius: 4, margin: 1 },
  heatmapCellGreen: { backgroundColor: 'rgba(34,197,94,0.4)' },
  heatmapCellYellow: { backgroundColor: 'rgba(253,224,71,0.7)' },
  heatmapCellOrange: { backgroundColor: 'rgba(251,146,60,0.7)' },
  heatmapLegendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  heatmapLegend: { fontSize: 11, color: '#8A8A8E' },
});

export default HealthDashboard;
