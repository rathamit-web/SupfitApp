import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Rect, Text as SvgText, Line, Path } from 'react-native-svg';
import FooterNav from '../components/FooterNav';
import { supabase } from '../lib/supabaseClient';

// Memoized icon components for performance


// Custom Total Revenue SVG icon (from assets/icons/TotalRevenue.svg)
const RevenueIcon = React.memo(() => (
  <Svg width={28} height={28} viewBox="0 -960 960 960" fill="none">
    <Path d="M200-120q-33 0-56.5-23.5T120-200v-640h80v640h640v80H200Zm40-120v-360h160v360H240Zm200 0v-560h160v560H440Zm200 0v-200h160v200H640Z" fill="#FF3C20" />
  </Svg>
));
RevenueIcon.displayName = 'RevenueIcon';

const UsersIcon = React.memo(() => <MaterialIcons name="group" size={32} color="#FF3C20" />);
UsersIcon.displayName = 'UsersIcon';

const screenWidth = Dimensions.get('window').width;
const CHART_CARD_HORIZONTAL_PADDING = 24;

// Helper function to format revenue value
const formatRevenueValue = (value: number): string => {
  if (value >= 100000) return `${(value / 1000).toFixed(2)}K`;
  if (value >= 10000) return `${(value / 1000).toFixed(2)}K`;
  if (value >= 1000) {
    return value % 1000 === 0 ? `${(value / 1000).toFixed(0)}K` : `${(value / 1000).toFixed(2)}K`;
  }
  return value.toLocaleString();
};

// Custom Bar Chart Component
const CustomBarChart = ({ data, viewMode }: { data: { month: string; revenue: number; clients: number }[]; viewMode: 'revenue' | 'clients' }) => {
  // Match the chart width to the card's inner width (card width - horizontal padding * 2)
  const chartWidth = screenWidth - 40 - CHART_CARD_HORIZONTAL_PADDING * 2;
  const chartHeight = 140;
  const barWidth = 50;
  const spacing = (chartWidth - (barWidth * data.length)) / (data.length + 1);
  
  // Get max value for scaling - reserve space at top for labels
  const values = data.map(d => viewMode === 'revenue' ? d.revenue : d.clients);
  const maxValue = Math.max(...values);
  const scaleY = (chartHeight - 60) / maxValue; // Increased space for labels
  
  return (
    <View style={{ width: chartWidth, height: chartHeight, marginVertical: 10 }}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Line
            key={`grid-${i}`}
            x1={0}
            y1={20 + i * (chartHeight - 60) / 4}
            x2={chartWidth}
            y2={20 + i * (chartHeight - 60) / 4}
            stroke="#f0f0f0"
            strokeWidth={1}
          />
        ))}
        
        {/* Bars and labels */}
        {data.map((item, index) => {
          const value = viewMode === 'revenue' ? item.revenue : item.clients;
          const barHeight = value * scaleY;
          const x = spacing + (spacing + barWidth) * index;
          const y = chartHeight - 40 - barHeight;
          return (
            <React.Fragment key={item.month}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#ff3c20"
                rx={6}
                ry={6}
              />
              {/* Value label above bar */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 8}
                fontSize={viewMode === 'revenue' ? 11 : 12}
                fontWeight="700"
                fill="#ff3c20"
                textAnchor="middle"
              >
                {viewMode === 'revenue' ? `₹${formatRevenueValue(value)}` : value}
              </SvgText>
              {/* Month label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 20}
                fontSize={14}
                fontWeight="700"
                fill="#222"
                textAnchor="middle"
              >
                {item.month}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

function RevenueTrackerScreen({ navigation }: any) {
  // Toggle state: 'revenue' or 'clients'
  const [viewMode, setViewMode] = useState<'revenue' | 'clients'>('revenue');

  // New Clients state
  const [newClients, setNewClients] = useState<{ id: number; name: string; revenue: string; avatar: string }[]>([]);

  // Data for both modes
  const barData = [
    { month: 'Oct', revenue: 65000, clients: 41 },
    { month: 'Nov', revenue: 73000, clients: 45 },
    { month: 'Dec', revenue: 80000, clients: 48 },
  ];

  const stats = [
    {
      label: 'Total Revenue',
      value: '₹6,222',
      change: '+2% this month',
      changeColor: '#23a94d',
      icon: RevenueIcon,
    },
    {
      label: 'Active Clients',
      value: '48',
      newClients: 7,
      dropOffs: 2,
      icon: UsersIcon,
    },
  ];

  // Top clients data
  const topClients = [
    {
      id: 2,
      name: 'Priya Sharma',
      revenue: '₹10,500',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 3,
      name: 'Rahul Verma',
      revenue: '₹8,200',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
  ];

  useEffect(() => {
    async function fetchNewClients() {
      // Get current and last month
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // JS months are 0-based
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const currentYear = now.getFullYear();
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Get current coach id
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        setNewClients([]);
        return;
      }
      const userId = authData.user.id;
      // Fetch coach row for this user (RLS safe)
      const { data: coachRows, error: coachError } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (coachError || !coachRows?.id) {
        setNewClients([]);
        return;
      }
      const coachId = coachRows.id;

      // Query coach_clients for new clients (joined with users for name/avatar)
      const { data, error } = await supabase
        .from('coach_clients')
        .select('client_id, start_date, users:client_id(full_name, avatar_url)')
        .eq('coach_id', coachId)
        .or(`and(extract(month from start_date).eq.${currentMonth},extract(year from start_date).eq.${currentYear}),and(extract(month from start_date).eq.${lastMonth},extract(year from start_date).eq.${lastMonthYear})`);
      if (error) {
        console.error('Error fetching new clients:', error);
        setNewClients([]);
      } else {
        // Map to UI shape
        const mapped = (data || []).map((row: any) => ({
          id: row.client_id,
          name: row.users?.full_name || 'Client',
          revenue: '', // Fill with actual revenue if available
          avatar: row.users?.avatar_url || '',
        }));
        setNewClients(mapped);
      }
    }
    fetchNewClients();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8f9fa', '#f5f5f7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {/* Total Revenue Card */}
            <View style={styles.statCardSmall}>
              <View style={styles.statIconContainerSmall}>
                <RevenueIcon />
              </View>
              <View style={styles.statContentSmall}>
                <Text style={styles.statLabelSmall}>{stats[0].label}</Text>
                <Text style={styles.statValueSmall}>{stats[0].value.replaceAll(/[^\d.,]/g, '')}</Text>
                <View style={styles.changePositiveSmall}>
                  <Text style={styles.changePositiveTextSmall}>{stats[0].change}</Text>
                </View>
              </View>
            </View>

            {/* Active Clients Card */}
            <View style={styles.statCardSmall}>
              <View style={styles.statIconContainerSmall}>
                <UsersIcon />
                <View style={styles.activeDotSmall} />
              </View>
              <View style={styles.statContentSmall}>
                <Text style={styles.statLabelSmall}>{stats[1].label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.statValueSmall}>{stats[1].value}</Text>
                  <Text style={styles.newClientsTextSmall}>+{stats[1].newClients} new</Text>
                </View>
                <View style={styles.dropOffBadgeSmall}>
                  <Text style={styles.dropOffTextSmall}>+{stats[1].dropOffs} drop-offs</Text>
                </View>
              </View>
            </View>

            {/* Client Retention Rate Card */}
            <View style={styles.statCardSmall}>
              <View style={styles.statIconContainerSmall}>
                <MaterialIcons name="trending-up" size={28} color="#FF3C20" />
              </View>
              <View style={styles.statContentSmall}>
                <Text style={styles.statLabelSmall}>Client Retention Rate</Text>
                <Text style={styles.statValueSmall}>92%</Text>
                <View style={styles.retentionBadge}>
                  <Text style={styles.retentionBadgeText}>Excellent</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Card with Toggle */}
          <View style={styles.chartCard}>
            {/* Apple Liquid Glass Toggle - Premium Design */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
              <BlurView 
                intensity={50} 
                tint="light" 
                style={{
                  padding: 3,
                  width: 140,
                  height: 34,
                  flexDirection: 'row',
                  borderRadius: 17,
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                  borderWidth: 0.5,
                  borderColor: 'rgba(0,0,0,0.06)',
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setViewMode('revenue')}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 14,
                    backgroundColor: viewMode === 'revenue' ? '#ff3c20' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2,
                    shadowColor: viewMode === 'revenue' ? '#ff3c20' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: viewMode === 'revenue' ? 2 : 0,
                  }}
                  accessibilityLabel="Show Revenue Chart"
                  accessibilityRole="button"
                >
                  <Text style={{
                    color: viewMode === 'revenue' ? '#fff' : '#8e8e93',
                    fontWeight: '700',
                    fontSize: 11,
                    letterSpacing: -0.2,
                  }}>Revenue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setViewMode('clients')}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                    borderRadius: 14,
                    backgroundColor: viewMode === 'clients' ? '#ff3c20' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: viewMode === 'clients' ? '#ff3c20' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: viewMode === 'clients' ? 2 : 0,
                  }}
                  accessibilityLabel="Show Clients Chart"
                  accessibilityRole="button"
                >
                  <Text style={{
                    color: viewMode === 'clients' ? '#fff' : '#8e8e93',
                    fontWeight: '700',
                    fontSize: 11,
                    letterSpacing: -0.2,
                  }}>Clients</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
            {/* Chart - positioned at bottom */}
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingTop: 16, paddingBottom: 8 }}>
              <CustomBarChart data={barData} viewMode={viewMode} />
            </View>
          </View>

          {/* Top Clients */}
          <View style={styles.topClientsCard}>
            <Text style={styles.sectionTitle}>Top Clients</Text>
            {topClients.map((client) => (
              <View key={client.id} style={styles.clientRow}>
                <View style={styles.clientLeft}>
                  <Image
                    source={{ uri: client.avatar }}
                    style={styles.clientAvatar}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                  <Text style={styles.clientName}>{client.name}</Text>
                </View>
                <Text style={styles.clientRevenue}>{client.revenue}</Text>
              </View>
            ))}
          </View>
          
            {/* New Clients */}
            <View style={styles.topClientsCard}>
              <Text style={styles.sectionTitle}>New Clients</Text>
              {newClients && newClients.length > 0 ? (
                newClients.map((client) => (
                  <View key={client.id} style={styles.clientRow}>
                    <View style={styles.clientLeft}>
                      <Image
                        source={{ uri: client.avatar }}
                        style={styles.clientAvatar}
                        resizeMode="cover"
                        fadeDuration={0}
                      />
                      <Text style={styles.clientName}>{client.name}</Text>
                    </View>
                    <Text style={styles.clientRevenue}>{client.revenue}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: '#8e8e93', fontSize: 14, padding: 12 }}>No new clients this period.</Text>
              )}
            </View>

          {/* Motivational Footer */}
          <View style={styles.motivationalFooter}>
            <Text style={styles.motivationalText}>Your effort = Your growth 🚀</Text>
          </View>

          {/* Bottom spacing for footer */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </LinearGradient>
      <FooterNav mode="coach" navigation={navigation} currentRoute="RevenueTracker" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Smaller stat card styles
  statCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 54,
  },
  statIconContainerSmall: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContentSmall: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 3,
  },
  statLabelSmall: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d1d1f',
    letterSpacing: -0.3,
  },
  changePositiveSmall: {
    backgroundColor: 'rgba(35,169,77,0.12)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  changePositiveTextSmall: {
    fontSize: 12,
    color: '#23a94d',
    fontWeight: '600',
  },
  activeDotSmall: {
    position: 'absolute',
    right: 6,
    top: 22,
    width: 8,
    height: 8,
    backgroundColor: '#23a94d',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  newClientsTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#23a94d',
    marginLeft: 6,
  },
  dropOffBadgeSmall: {
    backgroundColor: '#ff3c20',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  dropOffTextSmall: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  retentionBadge: {
    backgroundColor: '#23a94d',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  retentionBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // ...existing code...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6e6e73',
    letterSpacing: -1,
  },
  statsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 78,
  },
  statIconContainer: {
    backgroundColor: '#8e8e93',
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    right: 10,
    top: 20,
    width: 10,
    height: 10,
    backgroundColor: '#23a94d',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  statContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },
  changePositive: {
    backgroundColor: 'rgba(35,169,77,0.12)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  changePositiveText: {
    fontSize: 13,
    color: '#23a94d',
    fontWeight: '600',
  },
  newClientsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#23a94d',
    marginLeft: 8,
  },
  dropOffBadge: {
    backgroundColor: '#ff3c20',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  dropOffText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    padding: 20,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 32,
    alignSelf: 'center',
    width: screenWidth - 40,
    maxWidth: 480,
    minHeight: 220,
    overflow: 'visible',
  },
  toggleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor removed for glass effect
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    // padding removed for tight fit
    position: 'relative',
    width: 220,
    height: 48,
  },
  togglePill: {
    position: 'absolute',
    top: 4,
    width: 106,
    height: 40,
    borderRadius: 28,
    backgroundColor: '#ff3c20',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#ff3c20',
  },
  togglePillLeft: {
    left: 4,
  },
  togglePillRight: {
    left: 110,
  },
  toggleButton: {
    width: 106,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    zIndex: 2,
  },
  toggleButtonText: {
    fontWeight: '700',
    fontSize: 16,
    color: 'rgba(100,100,100,0.7)',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 0,
    borderRadius: 16,
  },
  topClientsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(24px)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1d1d1f',
  },
  clientRevenue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff3c20',
  },
  motivationalFooter: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 18,
    color: '#6e6e73',
    fontWeight: '500',
  },
});

export default RevenueTrackerScreen;
