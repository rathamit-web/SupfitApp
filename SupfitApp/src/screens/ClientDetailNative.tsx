import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FooterNav from '../components/FooterNav';

interface ClientDetailScreenProps {
  readonly navigation: {
    navigate: (screen: string, params?: Record<string, any>) => void;
    goBack: () => void;
  };
  readonly route: {
    params?: {
      clientId?: number;
    };
  };
}

const ClientDetailNative = ({ navigation, route }: ClientDetailScreenProps) => {
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const clientId = route?.params?.clientId || 1;

  const activeClients = [
    {
      id: 2,
      name: 'Amit',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      isNew: false,
    },
    {
      id: 3,
      name: 'Hari',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
      isNew: false,
    },
    {
      id: 4,
      name: 'Krishna',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
      isNew: false,
    },
    {
      id: 1,
      name: 'Pathik',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      isNew: true,
    },
    {
      id: 6,
      name: 'Priya',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      isNew: true,
    },
    {
      id: 5,
      name: 'Ravi',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
      isNew: false,
    },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const selectedClient = activeClients.find(c => c.id === clientId) || activeClients[0];

  const client = {
    ...selectedClient,
    name: 'Amit Rath',
    age: 28,
    program: 'Weight Loss Program',
    phone: '+91 98765 43210',
    email: 'amit.rath@email.com',
    status: 'Active',
    week: 'Week 8/12',
    plan: 'Premium',
    progress: {
      currentWeight: '78 kg',
      targetWeight: '74 kg',
      weightLoss: '↓ 8 kg loss',
      toGo: '4 kg to go',
      sessionsDone: '32/48',
      sessionsProgress: '67% complete',
      attendance: '94%',
      attendanceStatus: 'Excellent',
    },
    bodyMetrics: {
      bodyFat: { value: '18%', change: '↓ 5%' },
      muscleMass: { value: '35 kg', change: '↑ 2kg' },
      bmi: { value: '24.2', status: 'Normal' },
    },
    dietPreference: {
      dietaryPattern: ['Non-veg', 'Low-carb'],
      allergies: ['Lactose', 'Gluten'],
      foodLikesDislikes: { likes: ['Chicken', 'Fish', 'Eggs'], dislikes: ['Mushrooms', 'Tofu'] },
    },
    medicalHistory: {
      diagnosed: ['Type 2 Diabetes', 'Hypertension'],
      surgeries: ['Knee surgery (2020)', 'No current limitations'],
      familyHistory: ['Diabetes (Yes)', 'CVD (Yes)', 'Obesity (No)'],
      medications: ['Metformin 500mg', 'Omega-3 supplement'],
    },
    milestoneTargets: [
      {
        id: 1,
        title: 'Weight Loss',
        target: 'Lose 10 kg',
        current: '8 kg lost',
        progress: 80,
        deadline: 'Dec 31, 2025',
        status: 'on-track',
      },
      {
        id: 2,
        title: 'Body Fat %',
        target: 'Reach 15%',
        current: '18%',
        progress: 60,
        deadline: 'Jan 15, 2026',
        status: 'on-track',
      },
      {
        id: 3,
        title: 'Muscle Gain',
        target: 'Gain 5 kg muscle',
        current: '2 kg gained',
        progress: 40,
        deadline: 'Feb 28, 2026',
        status: 'in-progress',
      },
      {
        id: 4,
        title: 'Marathon Ready',
        target: 'Run 21 km',
        current: '10 km',
        progress: 48,
        deadline: 'Mar 31, 2026',
        status: 'in-progress',
      },
    ],
    weightProgress: 67,
    dietPlan: {
      dailyCalories: '2,000 kcal',
      macroSplit: '40% C / 30% P / 30% F',
      meals: [
        {
          type: 'Breakfast',
          icon: '🍳',
          description: 'Oatmeal, eggs, fruit',
          calories: '450 kcal',
        },
        {
          type: 'Lunch',
          icon: '🥗',
          description: 'Grilled chicken, quinoa, veggies',
          calories: '650 kcal',
        },
        {
          type: 'Dinner',
          icon: '🍽️',
          description: 'Fish, sweet potato, salad',
          calories: '600 kcal',
        },
      ],
    },
    recentActivity: [
      {
        id: 1,
        type: 'workout',
        title: 'Completed Workout',
        description: 'Strength Training - Upper Body',
        date: 'Nov 15, 2025 • 9:30 AM',
        completed: true,
      },
      {
        id: 2,
        type: 'weight',
        title: 'Weight Check-In',
        description: '78 kg (↓ 1 kg from last week)',
        date: 'Nov 13, 2025 • 7:00 AM',
        completed: false,
      },
      {
        id: 3,
        type: 'message',
        title: 'Sent Message',
        description: '"Can we adjust tomorrow\'s session time?"',
        date: 'Nov 12, 2025 • 6:45 PM',
        completed: false,
      },
    ],
    paymentHistory: [
      {
        id: 1,
        description: 'Monthly Subscription',
        date: '15 Oct 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 2,
        description: 'Monthly Subscription',
        date: '15 Sep 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
      {
        id: 3,
        description: 'Monthly Subscription',
        date: '15 Aug 2024',
        amount: '₹150.00',
        status: 'Paid',
      },
    ],
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    const userMessages = JSON.parse(await AsyncStorage.getItem('userMessages') || '[]');
    userMessages.push({
      clientId: client.id,
      message: messageText.trim(),
      from: 'coach',
      date: new Date().toISOString(),
    });
    await AsyncStorage.setItem('userMessages', JSON.stringify(userMessages));
    setSending(false);
    setMessageText('');
    setMessageModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={['rgba(96,165,250,0.1)', 'rgba(162,89,255,0.08)', 'rgba(255,255,255,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Active Clients Slider */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientsScroll}>
            {activeClients.map((client) => {
              const isSelected = client.id === selectedClient.id;
              return (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
                  style={[styles.clientCard, isSelected && styles.clientCardSelected]}
                >
                  {client.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>New</Text>
                    </View>
                  )}
                  {isSelected ? (
                    <LinearGradient
                      colors={['#60a5fa', '#a259ff', '#ff3c20', '#fbbf24', '#4ade80']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 62,
                        height: 62,
                        borderRadius: 31,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image source={{ uri: client.avatar }} style={[styles.clientAvatar, { borderWidth: 2, borderColor: '#fff', marginBottom: 0 }]} />
                    </LinearGradient>
                  ) : (
                    <Image source={{ uri: client.avatar }} style={styles.clientAvatar} />
                  )}
                  <Text style={[styles.clientName, isSelected && styles.clientNameSelected]}>
                    {client.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image source={{ uri: client.avatar }} style={styles.profileAvatar} />
            <Text style={[styles.profileName, { fontSize: 19, color: '#1d1d1f', fontWeight: '700' }]}>
              {client.name}
              <Text style={{ fontSize: 15, color: '#6e6e73', fontWeight: '500' }}> | Age: {client.age || '28'}</Text>
            </Text>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Client Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Overview</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['rgba(96,165,250,0.15)', 'rgba(34,211,238,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCard}
                >
                  <Text style={styles.overviewLabel}>Current Weight</Text>
                  <Text style={styles.overviewValue}>{client.progress.currentWeight}</Text>
                  <Text style={styles.overviewChangeGreen}>{client.progress.weightLoss}</Text>
                </LinearGradient>
              </View>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['rgba(162,89,255,0.15)', 'rgba(244,114,182,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCard}
                >
                  <Text style={styles.overviewLabel}>Target Weight</Text>
                  <Text style={styles.overviewValue}>{client.progress.targetWeight}</Text>
                  <Text style={styles.overviewSubtext}>{client.progress.toGo}</Text>
                </LinearGradient>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 }}>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['rgba(74,222,128,0.15)', 'rgba(52,211,153,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCard}
                >
                  <Text style={styles.overviewLabel}>Sessions Done</Text>
                  <Text style={styles.overviewValue}>{client.progress.sessionsDone}</Text>
                  <Text style={styles.overviewSubtext}>{client.progress.sessionsProgress}</Text>
                </LinearGradient>
              </View>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['rgba(251,146,60,0.15)', 'rgba(251,191,36,0.08)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewCard}
                >
                  <Text style={styles.overviewLabel}>Attendance</Text>
                  <Text style={styles.overviewValue}>{client.progress.attendance}</Text>
                  <Text style={styles.overviewChangeGreen}>{client.progress.attendanceStatus}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Body Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body Metrics</Text>
            <View style={styles.metricsGrid}>
              <LinearGradient
                colors={['#60a5fa', '#22d3ee']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>Body Fat</Text>
                <Text style={styles.metricValue}>{client.bodyMetrics.bodyFat.value}</Text>
                <Text style={styles.metricChange}>{client.bodyMetrics.bodyFat.change}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#4ade80', '#34d399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>Muscle Mass</Text>
                <Text style={styles.metricValue}>{client.bodyMetrics.muscleMass.value}</Text>
                <Text style={styles.metricChange}>{client.bodyMetrics.muscleMass.change}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#fb923c', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>BMI</Text>
                <Text style={styles.metricValue}>{client.bodyMetrics.bmi.value}</Text>
                <Text style={styles.metricChange}>{client.bodyMetrics.bmi.status}</Text>
              </LinearGradient>
            </View>

            {/* Weight Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Weight Progress</Text>
                <Text style={styles.progressPercentage}>{client.weightProgress}% to goal</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${client.weightProgress}%` }]} />
              </View>
            </View>
          </View>

          {/* Diet Preference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diet Preference</Text>
            <View style={styles.metricsGrid}>
              <LinearGradient
                colors={['#a78bfa', '#c084fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>Dietary Pattern</Text>
                <Text style={styles.metricValue}>{client.dietPreference.dietaryPattern.join(', ')}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#f472b6', '#fb7185']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>Allergies & Intolerances</Text>
                <Text style={styles.metricValue}>{client.dietPreference.allergies.length > 0 ? client.dietPreference.allergies.join(', ') : 'None'}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#38bdf8', '#818cf8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.metricCard}
              >
                <Text style={styles.metricLabel}>Food Likes / Dislikes</Text>
                <Text style={styles.dietPrefSubtext}>Likes: {client.dietPreference.foodLikesDislikes.likes.join(', ')}</Text>
                <Text style={styles.dietPrefSubtext}>Dislikes: {client.dietPreference.foodLikesDislikes.dislikes.join(', ')}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Medical History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <LinearGradient
                  colors={['#ef4444', '#f87171']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metricCard}
                >
                  <Text style={styles.metricLabel}>Diagnosed</Text>
                  <Text style={styles.metricValue}>{client.medicalHistory.diagnosed.join(', ')}</Text>
                </LinearGradient>
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <LinearGradient
                  colors={['#eab308', '#facc15']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metricCard}
                >
                  <Text style={styles.metricLabel}>Surgeries</Text>
                  <Text style={styles.metricValue}>{client.medicalHistory.surgeries.join(', ')}</Text>
                </LinearGradient>
              </View>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['#8b5cf6', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metricCard}
                >
                  <Text style={styles.metricLabel}>Family History</Text>
                  <Text style={styles.dietPrefSubtext}>{client.medicalHistory.familyHistory.join(', ')}</Text>
                </LinearGradient>
              </View>
              <View style={{ width: '48%' }}>
                <LinearGradient
                  colors={['#06b6d4', '#22d3ee']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.metricCard}
                >
                  <Text style={styles.metricLabel}>Medications</Text>
                  <Text style={styles.dietPrefSubtext}>{client.medicalHistory.medications.join(', ')}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Milestone Target */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestone Target</Text>
            <View style={styles.milestonesContainer}>
              {client.milestoneTargets.map((milestone) => {
                const statusColors: Record<string, [string, string]> = {
                  'on-track': ['#34d399', '#10b981'],
                  'in-progress': ['#60a5fa', '#3b82f6'],
                  'at-risk': ['#fb923c', '#f97316'],
                  'delayed': ['#ef4444', '#dc2626'],
                };
                const gradientColors = statusColors[milestone.status] || statusColors['in-progress'];
                
                const getStatusText = (status: string) => {
                  if (status === 'on-track') return '🎯 On Track';
                  if (status === 'in-progress') return '⏳ In Progress';
                  if (status === 'at-risk') return '⚠️ At Risk';
                  return '❌ Delayed';
                };
                
                return (
                  <View key={milestone.id} style={styles.milestoneCard}>
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.milestoneHeader}
                    >
                      <View style={styles.milestoneTitleRow}>
                        <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                        <View style={styles.milestoneStatusBadge}>
                          <Text style={styles.milestoneStatusText}>
                            {getStatusText(milestone.status)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                    
                    <View style={styles.milestoneContent}>
                      <View style={styles.milestoneRow}>
                        <Text style={styles.milestoneLabel}>Target:</Text>
                        <Text style={styles.milestoneValue}>{milestone.target}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <Text style={styles.milestoneLabel}>Current:</Text>
                        <Text style={styles.milestoneValue}>{milestone.current}</Text>
                      </View>
                      <View style={styles.milestoneRow}>
                        <Text style={styles.milestoneLabel}>Deadline:</Text>
                        <Text style={styles.milestoneValue}>{milestone.deadline}</Text>
                      </View>
                      
                      {/* Progress Bar */}
                      <View style={styles.milestoneProgressContainer}>
                        <View style={styles.milestoneProgressHeader}>
                          <Text style={styles.milestoneProgressLabel}>Progress</Text>
                          <Text style={styles.milestoneProgressPercentage}>{milestone.progress}%</Text>
                        </View>
                        <View style={styles.milestoneProgressBarBg}>
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.milestoneProgressBarFill, { width: `${milestone.progress}%` }]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {client.recentActivity.map((activity) => {
              const iconMap: Record<string, { name: string; gradient: string[] }> = {
                workout: { name: 'fitness-center', gradient: ['#c084fc', '#f472b6'] },
                weight: { name: 'monitor-weight', gradient: ['#60a5fa', '#22d3ee'] },
                message: { name: 'message', gradient: ['#fb923c', '#fbbf24'] },
              };
              const iconData = iconMap[activity.type] || iconMap.workout;
              return (
                <View key={activity.id} style={styles.activityCard}>
                  <LinearGradient
                    colors={iconData.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activityIcon}
                  >
                    <MaterialIcons name={iconData.name as any} size={20} color="#fff" />
                  </LinearGradient>
                  <View style={styles.activityInfo}>
                    <View style={styles.activityTitleRow}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.completed && (
                        <MaterialIcons name="check-circle" size={18} color="#34c759" />
                      )}
                    </View>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Payment History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription & Payment (Last 3 Months)</Text>
            <View style={styles.paymentCard}>
              {/* Table Header */}
              <View style={styles.paymentHeader}>
                <Text style={[styles.paymentHeaderText, { flex: 2 }]}>Description</Text>
                <Text style={[styles.paymentHeaderText, { flex: 1, textAlign: 'center' }]}>Amount</Text>
                <Text style={[styles.paymentHeaderText, { flex: 1, textAlign: 'center' }]}>Status</Text>
              </View>
              {/* Table Rows */}
              {client.paymentHistory.map((payment, index) => {
                const isPaid = payment.status === 'Completed' || payment.status === 'Paid';
                const isOverdue = payment.status === 'Overdue' || payment.status === 'Due';
                return (
                  <View
                    key={payment.id}
                    style={[
                      styles.paymentRow,
                      index < client.paymentHistory.length - 1 && styles.paymentRowBorder,
                      isPaid && styles.paymentRowPaid,
                      isOverdue && styles.paymentRowOverdue,
                    ]}
                  >
                    <View style={{ flex: 2 }}>
                      <Text style={styles.paymentDescription}>{payment.description}</Text>
                      <Text style={styles.paymentDate}>{payment.date}</Text>
                    </View>
                    <Text style={[styles.paymentAmount, { flex: 1, textAlign: 'center' }]}>
                      {payment.amount}
                    </Text>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <View
                        style={[
                          styles.statusBadge,
                          isPaid && styles.statusBadgePaid,
                          isOverdue && styles.statusBadgeOverdue,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isPaid && styles.statusTextPaid,
                            isOverdue && styles.statusTextOverdue,
                          ]}
                        >
                          {payment.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.summaryCardPaid]}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={styles.summaryValuePaid}>
                  ₹{client.paymentHistory
                    .filter(p => p.status === 'Completed' || p.status === 'Paid')
                    .reduce((sum, p) => sum + Number.parseInt(p.amount.replace('₹', '').replace(',', ''), 10), 0)
                    .toLocaleString()}
                </Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryCardOverdue]}>
                <Text style={styles.summaryLabel}>Due/Overdue</Text>
                <Text style={styles.summaryValueOverdue}>
                  ₹{client.paymentHistory
                    .filter(p => p.status === 'Overdue' || p.status === 'Due')
                    .reduce((sum, p) => sum + Number.parseInt(p.amount.replace('₹', '').replace(',', ''), 10), 0)
                    .toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Suggestions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <View style={styles.suggestionsGrid}>
              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => navigation.navigate('SupplementRecommendationNative', { clientId: selectedClient.id })}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconWrap}>
                    <MaterialIcons name="local-pharmacy" size={16} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>Supplement Recommendation</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6e6e73" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => navigation.navigate('WorkoutPlanNative', { clientId: selectedClient.id })}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconWrap}>
                    <MaterialIcons name="fitness-center" size={16} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>Workout Plan</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6e6e73" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => navigation.navigate('DietPlanNative', { clientId: selectedClient.id })}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconWrap}>
                    <MaterialIcons name="restaurant" size={16} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>Diet Plans</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6e6e73" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => setMessageModalVisible(true)}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconWrap}>
                    <MaterialIcons name="message" size={16} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>Message</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6e6e73" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionCard}
                onPress={() => navigation.navigate('ScheduleSession', { clientId: client.id })}
              >
                <View style={styles.suggestionLeft}>
                  <View style={styles.suggestionIconWrap}>
                    <MaterialIcons name="event" size={16} color="#fff" />
                  </View>
                  <Text style={styles.suggestionText}>Schedule Session</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#6e6e73" />
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </ScrollView>

      {/* Message Modal */}
      <Modal visible={messageModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message to Client</Text>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type your message here..."
              multiline
              numberOfLines={4}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setMessageModalVisible(false)}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={sending || !messageText.trim()}
                style={[
                  styles.modalButton,
                  styles.modalButtonSend,
                  (sending || !messageText.trim()) && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonTextSend}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FooterNav mode="coach" navigation={navigation} currentRoute="ClientDetail" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clientsScroll: {
    marginBottom: 24,
  },
  clientCard: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    minWidth: 80,
    position: 'relative',
    // Removed shadow and background for a clean look
  },
  clientCardSelected: {
    // backgroundColor: '#ff3c20', // Removed to eliminate colored rectangle
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff3c20',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  clientNameSelected: {
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 12,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ff3c20',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#ff3c20',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  overviewLabel: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  overviewChangeGreen: {
    fontSize: 13,
    color: '#34c759',
    fontWeight: '600',
  },
  overviewSubtext: {
    fontSize: 13,
    color: '#6e6e73',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewHistoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34c759',
  },
  viewHistoryText: {
    fontSize: 13,
    color: '#34c759',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 6,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  metricChange: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  dietPrefSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 15,
    color: '#6e6e73',
  },
  progressPercentage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff3c20',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff3c20',
    borderRadius: 3,
  },
  dietCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dietHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  dietHeaderLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 4,
  },
  dietHeaderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  mealIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  mealDescription: {
    fontSize: 13,
    color: '#6e6e73',
  },
  mealCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff3c20',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#86868b',
  },
  paymentCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paymentHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,60,32,0.05)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  paymentHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  paymentRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  paymentRowPaid: {
    backgroundColor: 'rgba(52,199,89,0.03)',
  },
  paymentRowOverdue: {
    backgroundColor: 'rgba(244,67,54,0.03)',
  },
  paymentDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 11,
    color: '#6e6e73',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,152,0,0.15)',
  },
  statusBadgePaid: {
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  statusBadgeOverdue: {
    backgroundColor: 'rgba(244,67,54,0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff9500',
  },
  statusTextPaid: {
    color: '#34c759',
  },
  statusTextOverdue: {
    color: '#f44336',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryCardPaid: {
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
  },
  summaryCardOverdue: {
    backgroundColor: 'rgba(244,67,54,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 4,
  },
  summaryValuePaid: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34c759',
  },
  summaryValueOverdue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f44336',
  },
  suggestionsGrid: {
    gap: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  milestonesContainer: {
    gap: 16,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  milestoneHeader: {
    padding: 14,
  },
  milestoneTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  milestoneStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  milestoneStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  milestoneContent: {
    padding: 16,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  milestoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
  },
  milestoneValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  milestoneProgressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  milestoneProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  milestoneProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6e6e73',
  },
  milestoneProgressPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  milestoneProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  milestoneProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSend: {
    backgroundColor: '#ff3c20',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  modalButtonTextSend: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ClientDetailNative;
