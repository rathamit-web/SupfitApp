import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Pressable, Platform, Modal, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getSubscription, saveSubscription } from '../lib/subscriptionStorage';
import { uploadWorkoutImage } from '../lib/workoutImageUpload';
import * as FileSystem from 'expo-file-system';

type SubscriptionType = 'gym' | 'coach' | 'dietician';
interface SubscriptionData {
  name: string;
  status: string;
  amount: string;
  validUpto?: string | null;
  packageName?: string | null;
}
// Save subscription to Supabase and local storage
async function saveSubscriptionToBackend(type: SubscriptionType, data: SubscriptionData) {
  // Save to local storage
  await saveSubscription(type, data);
  // Save to Supabase (upsert by user_id and type)
  try {
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) return;
    await supabase.from('subscriptions').upsert([
      {
        user_id,
        type,
        name: data.name,
        status: data.status,
        amount: data.amount,
        validUpto: data.validUpto,
        packageName: data.packageName,
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'user_id,type' });
  } catch (e) {
    // Optionally handle error
  }
}
import { supabase } from '../lib/supabaseClient';

// Utility functions (pure, no hooks)
async function syncSummaryToSupabase(summary) {
  if (!summary) return;
  try {
    await supabase.from('daily_metrics').upsert([summary], { onConflict: ['date'] });
  } catch (e) {}
}
const DAILY_SUMMARY_KEY = 'dailySummary';
async function saveDailySummary(summary) {
  await AsyncStorage.setItem(DAILY_SUMMARY_KEY, JSON.stringify(summary));
}
async function getDailySummary() {
  const data = await AsyncStorage.getItem(DAILY_SUMMARY_KEY);
  return data ? JSON.parse(data) : null;
}
// Example: Fetch daily steps (expand for more metrics as needed)
async function fetchDailySteps() {
  let AppleHealthKit, HealthConnect, GoogleFit;
  if (Platform.OS === 'ios') {
    try { AppleHealthKit = require('react-native-health'); } catch {}
  } else if (Platform.OS === 'android') {
    try { HealthConnect = require('react-native-health-connect'); } catch {}
    try { GoogleFit = require('react-native-google-fit'); } catch {}
  }
  if (Platform.OS === 'ios' && AppleHealthKit) {
    return new Promise((resolve, reject) => {
      const options = { date: new Date().toISOString() };
      AppleHealthKit.getStepCount(options, (err, res) => {
        if (err) return reject(err);
        resolve(res.value);
      });
    });
  } else if (Platform.OS === 'android' && (HealthConnect || GoogleFit)) {
    try {
      if (HealthConnect) {
        // Pseudo: Replace with actual Health Connect API usage
        return 0;
      } else if (GoogleFit) {
        // Pseudo: Replace with actual Google Fit API usage
        return 0;
      }
    } catch (e) {
      return 0;
    }
  }
  return 0;
}
// Custom hook for fetching analytics history from Supabase
function useSupabaseDailyMetricsHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('daily_metrics')
          .select('*')
          .order('date', { ascending: false })
          .limit(30);
        if (mounted) {
          if (error) setError(error.message);
          else setHistory(data || []);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e.message);
          setLoading(false);
        }
      }
    }
    fetchHistory();
    return () => { mounted = false; };
  }, []);
  return { history, loading, error };
}
// Supabase user profile fetch/update hook
function useSupabaseUserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();
    if (error) setError(error.message);
    else setProfile(data);
    setLoading(false);
  }, []);

  // Update profile name or avatar
  const updateProfile = useCallback(async (fields: { name?: string; avatar?: string }) => {
    setLoading(true);
    setError(null);
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', user_id);
    if (error) setError(error.message);
    await fetchProfile();
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  return { profile, loading, error, updateProfile };
}

export default function IndividualUserHome({ navigation, route }) {
    // Main stats for profile header
    const stats = [
      { label: 'Active Hours', value: '6.5', unit: 'hrs', icon: (props) => <MaterialIcons name="bolt" {...props} /> },
      { label: 'Followers', value: '12.5K', icon: (props) => <MaterialIcons name="group" {...props} /> },
      { label: 'Rewards', value: '89', unit: '🏆', icon: (props) => <MaterialIcons name="trending-up" {...props} /> },
    ];
  // State for daily metrics (from cache)
  const [dailyMetrics, setDailyMetrics] = useState(null);
  // Supabase user profile
  const { profile: supaProfile, loading: supaLoading, error: supaError, updateProfile } = useSupabaseUserProfile();
  // Subscription states
  const [gymSubscription, setGymSubscription] = useState(null);
  const [coachSubscription, setCoachSubscription] = useState(null);
  const [dieticianSubscription, setDieticianSubscription] = useState(null);
  // Reload subscriptions on screen focus
  useFocusEffect(
    useCallback(() => {
      async function loadAll() {
        setGymSubscription(await getSubscription('gym'));
        setCoachSubscription(await getSubscription('coach'));
        setDieticianSubscription(await getSubscription('dietician'));
      }
      loadAll();
    }, [])
  );

  // Handler to update a subscription (best practice: update both local and backend)
  const handleUpdateSubscription = async (type: SubscriptionType, data: SubscriptionData) => {
    await saveSubscriptionToBackend(type, data);
    if (type === 'gym') setGymSubscription(data);
    if (type === 'coach') setCoachSubscription(data);
    if (type === 'dietician') setDieticianSubscription(data);
  };
  // Profile image state (for local preview only)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  useEffect(() => {
    if (supaProfile?.avatar) setProfileImage(supaProfile.avatar);
  }, [supaProfile?.avatar]);

  // Upload image to Supabase Storage and update avatar URL in profile
  const handleEditProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      // Upload to Supabase Storage
      try {
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) throw new Error('User not logged in');
        const fileExt = uri.split('.').pop();
        const fileName = `avatars/${user_id}_${Date.now()}.${fileExt}`;
        const fileData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, Buffer.from(fileData, 'base64'), { contentType: 'image/*', upsert: true });
        if (uploadError) throw uploadError;
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const publicUrl = publicUrlData?.publicUrl;
        if (publicUrl) {
          await updateProfile({ avatar: publicUrl });
        }
      } catch (e: any) {
        Alert.alert('Upload failed', e.message || 'Could not upload image');
      }
    }
  };

  // Edit profile name
  const handleEditProfileName = async (newName: string) => {
    try {
      await updateProfile({ name: newName });
    } catch (e: any) {
      Alert.alert('Update failed', e.message || 'Could not update name');
    }
  };
  // Workouts state (persisted)
  const [workouts, setWorkouts] = useState([
    { id: 1, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', likes: 234, comments: 12, caption: 'Morning cardio session 💪 Crushed 10K!', workout: 'Running' },
    { id: 2, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80', likes: 189, comments: 8, caption: 'Leg day hits different 🔥', workout: 'Strength' },
    { id: 3, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', likes: 312, comments: 15, caption: 'New PR on deadlifts! 💯', workout: 'Powerlifting' },
    { id: 4, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', likes: 276, comments: 19, caption: 'Yoga flow to end the week 🧘', workout: 'Yoga' },
  ]);
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('workouts');
      if (saved) setWorkouts(JSON.parse(saved));
    })();
  }, []);
  const persistWorkouts = async (next) => {
    setWorkouts(next);
    await AsyncStorage.setItem('workouts', JSON.stringify(next));
  };
  // Edit workout modal state
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [editWorkoutType, setEditWorkoutType] = useState('');
  const [editImage, setEditImage] = useState('');
  const openEditWorkout = (id) => {
    const w = workouts.find(w => w.id === id);
    if (w) {
      setEditingWorkout(id);
      setEditCaption(w.caption);
      setEditWorkoutType(w.workout);
      setEditImage(w.image);
    }
  };
  const handleEditWorkoutImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // compress for upload
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) throw new Error('User not logged in');
        // Upload to Supabase Storage and get public URL
        const publicUrl = await uploadWorkoutImage(result.assets[0].uri, user_id);
        if (publicUrl) setEditImage(publicUrl);
      } catch (e) {
        Alert.alert('Upload failed', e.message || 'Could not upload image');
      }
    }
  };
  const saveEditWorkout = async () => {
    if (editingWorkout !== null) {
      const next = workouts.map(w => w.id === editingWorkout ? { ...w, caption: editCaption, workout: editWorkoutType, image: editImage } : w);
      await persistWorkouts(next);
      setEditingWorkout(null);
    }
  };
  // Daily metrics cache and sync
  useEffect(() => {
    async function loadMetrics() {
      const summary = await getDailySummary();
      setDailyMetrics(summary);
    }
    loadMetrics();
  }, []);
  useEffect(() => {
    async function fetchCacheAndSync() {
      try {
        const steps = await fetchDailySteps();
        const summary = {
          date: new Date().toISOString().slice(0, 10),
          steps,
        };
        await saveDailySummary(summary);
        await syncSummaryToSupabase(summary);
        setDailyMetrics(summary);
      } catch (e) {}
    }
    fetchCacheAndSync();
  }, []);
  // Likes/comments/modal state
  const [showLikesModal, setShowLikesModal] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [commentLikes, setCommentLikes] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  // Metrics for UI
  const metrics = [
    { label: 'Steps', value: dailyMetrics?.steps?.toLocaleString() || '—', target: '10,000', progress: dailyMetrics?.steps ? Math.round((dailyMetrics.steps / 10000) * 100) : 0, unit: '', gradient: ['#60a5fa', '#22d3ee'] },
    { label: 'Gym', value: '1', unit: 'hr', completed: true, gradient: ['#c084fc', '#f472b6'] },
    { label: 'Badminton', value: '1', unit: 'hr', completed: true, gradient: ['#4ade80', '#34d399'] },
    { label: 'Swim', value: '45', unit: 'min', completed: true, gradient: ['#22d3ee', '#60a5fa'] },
    { label: 'Calories', value: '520', unit: 'kcal', gradient: ['#fb923c', '#f87171'] },
    { label: 'Avg HR', value: '78', unit: 'bpm', gradient: ['#fb7185', '#f472b6'] },
    { label: 'Sleep', value: '7h 20m', gradient: ['#818cf8', '#c084fc'] },
  ];
  const postLikes: { [key: number]: { id: number; name: string; avatar: string; time: string }[] } = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '2h ago' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', time: '5h ago' },
      { id: 3, name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', time: '1d ago' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', time: '1h ago' },
      { id: 2, name: 'Lisa Brown', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '3h ago' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', time: '30m ago' },
      { id: 2, name: 'Anna Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', time: '2h ago' },
      { id: 3, name: 'Tom Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', time: '4h ago' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', time: '1h ago' },
      { id: 2, name: 'Chris Martin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', time: '6h ago' },
    ],
  };
  const postComments: { [key: number]: { id: number; name: string; avatar: string; message: string; time: string }[] } = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Amazing workout! Keep it up! 💪', time: '2h ago' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', message: 'This is so inspiring! Can you share the routine?', time: '5h ago' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', message: 'Great form! 🔥', time: '1h ago' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', message: 'Incredible transformation! How long did this take?', time: '30m ago' },
      { id: 2, name: 'Anna Davis', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', message: 'You\'re such an inspiration! 🙌', time: '2h ago' },
      { id: 3, name: 'Tom Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', message: 'Would love to train with you!', time: '4h ago' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Perfect yoga session! 🧘', time: '1h ago' },
    ],
  };

  // Glassmorphic, modern, fixed footer styles
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
      elevation: 4, // replaced shadow* with elevation for cross-platform
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
      elevation: 2,
    },
  });

  const styles = StyleSheet.create({
    container: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 24, backgroundColor: 'transparent' },
    profileHeaderWrap: { width: '100%', maxWidth: 1400, paddingHorizontal: 20, marginBottom: 24 },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    avatarWrap: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)', elevation: 8, marginRight: 20, backgroundColor: '#fff', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 65 },
    profileName: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 4 },
    profileSubtitle: { fontSize: 16, color: '#6e6e73', fontWeight: '500' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, width: '100%', maxWidth: 600, alignSelf: 'center' },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: 12, alignItems: 'center', marginHorizontal: 2, elevation: 1, minWidth: 90, maxWidth: 110 },
    statIconWrap: { padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,60,32,0.12)', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: '700', color: '#1d1d1f' },
    statUnit: { fontSize: 12, color: '#6e6e73', fontWeight: '500' },
    statLabel: { fontSize: 14, color: '#6e6e73', fontWeight: '500', marginTop: 2 },
    // Added styles for new sections:
    noteCard: { backgroundColor: '#fff7f5', borderRadius: 18, borderWidth: 1, borderColor: '#ffe5e0', padding: 20, marginVertical: 12, width: '90%', maxWidth: 700 },
    noteTitle: { color: '#ff3c20', fontWeight: '700', fontSize: 18, marginBottom: 8 },
    noteText: { color: '#1d1d1f', fontSize: 16, fontStyle: 'italic' },
    messageCard: { backgroundColor: '#f5faff', borderRadius: 18, borderWidth: 1, borderColor: '#e0f0ff', padding: 20, marginVertical: 12, width: '90%', maxWidth: 700 },
    messageTitle: { color: '#2078ff', fontWeight: '700', fontSize: 18, marginBottom: 8 },
    messageItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0f0ff', marginBottom: 8 },
    messageText: { fontSize: 15, color: '#1d1d1f', fontWeight: '500' },
    messageMeta: { fontSize: 12, color: '#6e6e73', fontStyle: 'italic' },
    sectionWrap: { width: '100%', maxWidth: 1400, paddingHorizontal: 20, marginVertical: 18 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    sectionTitle: { fontSize: 28, fontWeight: '700', color: '#1d1d1f' },
    sectionSubtitle: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,60,32,0.1)', color: '#ff3c20', fontWeight: '600', fontSize: 13 },
    postCard: { width: 280, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 22, overflow: 'hidden', marginRight: 16, elevation: 2 },
    postImage: { width: '100%', height: 180 },
    postContent: { padding: 12 },
    postHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    postCaption: { fontWeight: '600', fontSize: 15, color: '#1d1d1f', flex: 1 },
    editBtn: { marginLeft: 8, padding: 4 },
    postWorkout: { fontSize: 13, color: '#ff3c20', fontWeight: '700', marginBottom: 4 },
    postStatsRow: { flexDirection: 'row', alignItems: 'center' },
    postStat: { color: '#6e6e73', fontSize: 14, marginRight: 12 },
    metricCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 14, marginBottom: 10 },
    metricIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    metricLabel: { fontSize: 14, fontWeight: '600', color: '#1d1d1f' },
    metricProgressBarBg: { width: 120, height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
    metricProgressBar: { height: 4, backgroundColor: '#ff3c20', borderRadius: 2 },
    metricValue: { fontSize: 17, fontWeight: '700', color: '#1d1d1f' },
    metricTarget: { fontSize: 12, color: '#6e6e73' },
    metricDone: { fontSize: 12, color: '#34c759' },
    subscriptionCard: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 20, marginBottom: 12, elevation: 2 },
    subscriptionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    subscriptionType: { fontSize: 13, color: '#6e6e73', fontWeight: '500' },
    subscriptionName: { fontSize: 17, fontWeight: '700', color: '#1d1d1f' },
    subscriptionAmount: { fontSize: 24, fontWeight: '700', color: '#1d1d1f' },
    subscriptionValid: { fontSize: 12, fontWeight: '500', color: '#34c759' },
    subscriptionPackage: { fontSize: 12, fontWeight: '500', color: '#6e6e73' },
    subscribeBtn: { backgroundColor: '#ff3c20', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', marginTop: 10 },
    subscribeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    dietRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12 },
    dietCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 16, marginHorizontal: 6, alignItems: 'center' },
    dietMealTitle: { fontSize: 17, fontWeight: '700', color: '#1d1d1f', marginBottom: 6 },
    dietMealMain: { fontSize: 14, color: '#1d1d1f', textAlign: 'center' },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'center',
      minHeight: 320,
      maxHeight: '70%',
      // Removed all shadow properties for web compatibility
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1d1d1f',
    },
    modalItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: '#f0f0f0',
    },
    modalAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    modalName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1d1d1f',
    },
    modalTime: {
      fontSize: 12,
      color: '#6e6e73',
    },
    modalComment: {
      fontSize: 14,
      color: '#1d1d1f',
      flex: 1,
      marginLeft: 8,
    },
  });

  // Handler to toggle like for a comment
  const handleLikeComment = (commentId: number) => {
    setCommentLikes((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };
  // Handler to update reply input for a comment
  const handleReplyInput = (commentId: number, text: string) => {
    setReplyInputs((prev) => ({ ...prev, [commentId]: text }));
  };
  // Handler to submit reply (stub)
  const handleReplySubmit = (commentId: number) => {
    // You can implement actual reply logic here
    setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
  };

  // Clean ternary for profile section
  let profileSection;
  if (supaLoading) {
    profileSection = (
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <ActivityIndicator size="large" color="#ff3c20" />
        <Text style={{ color: '#ff3c20', fontWeight: '700', fontSize: 18, marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  } else if (supaError) {
    // Show a blank profile circle and prompt to upload, not the error
    profileSection = (
      <View style={styles.profileRow}>
        <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8} onPress={handleEditProfileImage} accessibilityLabel="Edit profile picture">
          {/* Blank circle placeholder */}
          <View style={[styles.avatarImg, { backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' }]}> 
            <MaterialIcons name="person" size={48} color="#d1d1d6" />
          </View>
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 16,
            padding: 4,
            elevation: 2,
            elevation: 2,
          }}>
            <MaterialIcons name="edit" size={18} color="#ff3c20" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Your Name</Text>
          <Text style={styles.profileSubtitle}>Tap to upload your profile picture</Text>
        </View>
      </View>
    );
  } else if (supaProfile) {
    // If no avatar, show placeholder
    profileSection = (
      <View style={styles.profileRow}>
        <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8} onPress={handleEditProfileImage} accessibilityLabel="Edit profile picture">
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarImg, { backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' }]}> 
              <MaterialIcons name="person" size={48} color="#d1d1d6" />
            </View>
          )}
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 16,
            padding: 4,
            elevation: 2,
          }}>
            <MaterialIcons name="edit" size={18} color="#ff3c20" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.profileName, { flex: 1 }]}
            value={supaProfile?.name || ''}
            placeholder="Your Name"
            onChangeText={handleEditProfileName}
            onBlur={() => {}}
            autoCorrect={false}
            autoCapitalize="words"
            underlineColorAndroid="transparent"
          />
        </View>
        <Text style={styles.profileSubtitle}>{supaProfile?.username || 'Tap to upload your profile picture'}</Text>
      </View>
    );
  } else {
    // No profile at all: show placeholder
    profileSection = (
      <View style={styles.profileRow}>
        <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.8} onPress={handleEditProfileImage} accessibilityLabel="Edit profile picture">
          <View style={[styles.avatarImg, { backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' }]}> 
            <MaterialIcons name="person" size={48} color="#d1d1d6" />
          </View>
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderRadius: 16,
            padding: 4,
            elevation: 2,
            elevation: 2,
          }}>
            <MaterialIcons name="edit" size={18} color="#ff3c20" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Your Name</Text>
          <Text style={styles.profileSubtitle}>Tap to upload your profile picture</Text>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#f8f9fa", "#f5f5f7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Supabase Profile Section */}
        <View style={styles.profileHeaderWrap}>{profileSection}
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            {stats.map((stat, idx) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={styles.statIconWrap}>
                  {typeof stat.icon === 'function' ? stat.icon({ size: 24, color: '#ff3c20' }) : null}
                </View>
                <Text style={styles.statValue}>
                  {stat.value}
                  {stat.unit && <Text style={styles.statUnit}> {stat.unit}</Text>}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </View>
          <View style={{ width: '100%' }}>
            {workouts.map((post) => (
              <View key={post.id} style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}> 
                <TouchableOpacity activeOpacity={0.8} onPress={() => openEditWorkout(post.id)} accessibilityLabel="Edit workout image">
                  <Image
                    source={{ uri: post.image }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: 16,
                    padding: 4,
                    elevation: 2,
                    elevation: 2,
                  }}>
                    <MaterialIcons name="edit" size={18} color="#ff3c20" />
                  </View>
                </TouchableOpacity>
                <View style={styles.postContent}>
                  <View style={styles.postHeaderRow}>
                    <Text style={styles.postCaption}>{post.caption}</Text>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditWorkout(post.id)} accessibilityLabel="Edit workout caption and type">
                      <MaterialIcons name="edit" size={16} color="#ff3c20" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.postWorkout}>{post.workout}</Text>
                  <View style={styles.postStatsRow}>
                    <TouchableOpacity style={footerStyles.iconBtn} onPress={() => setShowLikesModal(post.id)}>
                      <MaterialIcons name="favorite" size={22} color="#ff3c20" />
                      <Text style={styles.postStat}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={footerStyles.iconBtn} onPress={() => setShowCommentsModal(post.id)}>
                      <MaterialIcons name="chat-bubble-outline" size={22} color="#6e6e73" />
                      <Text style={styles.postStat}>{post.comments}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
              {/* Edit Workout Modal */}
              <Modal visible={editingWorkout !== null} animationType="slide" transparent onRequestClose={() => setEditingWorkout(null)}>
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContent, { minHeight: 380 }]}>  
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Edit Workout</Text>
                      <TouchableOpacity onPress={() => setEditingWorkout(null)}>
                        <MaterialIcons name="close" size={24} color="#1d1d1f" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleEditWorkoutImage} style={{ alignSelf: 'center', marginBottom: 16 }}>
                      <Image source={{ uri: editImage }} style={{ width: 180, height: 120, borderRadius: 12, backgroundColor: '#eee' }} />
                      <View style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: 16,
                        padding: 4,
                        elevation: 2,
                        elevation: 2,
                      }}>
                        <MaterialIcons name="edit" size={18} color="#ff3c20" />
                      </View>
                    </TouchableOpacity>
                    <Text style={{ fontWeight: '600', fontSize: 14, marginBottom: 4 }}>Workout Type</Text>
                    <TextInput
                      value={editWorkoutType}
                      onChangeText={setEditWorkoutType}
                      placeholder="e.g., Running, Strength, Yoga"
                      style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15 }}
                    />
                    <Text style={{ fontWeight: '600', fontSize: 14, marginBottom: 4 }}>Caption</Text>
                    <TextInput
                      value={editCaption}
                      onChangeText={setEditCaption}
                      placeholder="Write your caption here..."
                      style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 20, fontSize: 15, minHeight: 60, textAlignVertical: 'top' }}
                      multiline
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <TouchableOpacity onPress={() => setEditingWorkout(null)} style={{ flex: 1, marginRight: 8, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', padding: 12 }}>
                        <Text style={{ color: '#1d1d1f', fontWeight: '600' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={saveEditWorkout} style={{ flex: 1, marginLeft: 8, backgroundColor: '#ff3c20', borderRadius: 10, alignItems: 'center', padding: 12 }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
        </View>

        {/* Daily Metrics */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Daily Metrics</Text>
          {metrics.map((metric, idx) => (
            <View key={metric.label} style={styles.metricCard}>
              <LinearGradient colors={metric.gradient as [string, string]} style={styles.metricIconWrap}>
                <View style={{ width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10 }} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                {metric.target ? (
                  <View style={styles.metricProgressBarBg}>
                    <View style={[styles.metricProgressBar, { width: `${metric.progress}%` }]} />
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metricValue}>{metric.value} {metric.unit}</Text>
                {metric.target ? <Text style={styles.metricTarget}>/ {metric.target}</Text> : null}
                {metric.completed ? <Text style={styles.metricDone}>✓ Done</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* Subscriptions */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Subscriptions</Text>
          {/* Subscription Cards - DRY, best practice */}
          {[
            {
              type: 'gym' as SubscriptionType,
              label: 'My Gym',
              subscription: gymSubscription as SubscriptionData | null,
              nav: 'SelectGymNative',
            },
            {
              type: 'coach' as SubscriptionType,
              label: 'Gym Coach',
              subscription: coachSubscription as SubscriptionData | null,
              nav: 'SelectCoachNative',
            },
            {
              type: 'dietician' as SubscriptionType,
              label: 'Dietician',
              subscription: dieticianSubscription as SubscriptionData | null,
              nav: 'SelectDieticianNative',
            },
          ].map(({ type, label, subscription, nav }) => (
            <View key={type} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeaderRow}>
                <Text style={styles.subscriptionType}>{label}</Text>
                {subscription && (
                  <TouchableOpacity
                    style={{ marginLeft: 8, padding: 4 }}
                    onPress={() => navigation.navigate(nav, {
                      onSave: (data: SubscriptionData) => handleUpdateSubscription(type, data),
                      subscription,
                    })}
                    accessibilityLabel={`Edit ${label} subscription`}
                  >
                    <MaterialIcons name="edit" size={22} color="#ff3c20" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.subscriptionName}>{subscription?.name || 'Not Selected'}</Text>
              <Text style={styles.subscriptionAmount}>{subscription?.amount || '₹0'}</Text>
              {subscription?.validUpto && (
                <Text style={styles.subscriptionValid}>Valid upto: {subscription.validUpto}</Text>
              )}
              {subscription?.packageName && (
                <Text style={styles.subscriptionPackage}>{subscription.packageName}</Text>
              )}
              {!subscription && (
                <TouchableOpacity style={styles.subscribeBtn} onPress={() => navigation.navigate(nav, {
                  onSave: (data: SubscriptionData) => handleUpdateSubscription(type, data),
                  subscription: null,
                })}>
                  <Text style={styles.subscribeBtnText}>Subscribe</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Diet Recommendation */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Diet Recommendation</Text>
          <View style={styles.dietRow}>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Breakfast</Text>
              <Text style={styles.dietMealMain}>Oatmeal with berries and almonds</Text>
            </View>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Lunch</Text>
              <Text style={styles.dietMealMain}>Grilled chicken with quinoa and vegetables</Text>
            </View>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Dinner</Text>
              <Text style={styles.dietMealMain}>Lean beef with sweet potato and asparagus</Text>
            </View>
          </View>
        </View>

        {/* Messages (moved after Diet Recommendation) */}
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Messages from Coach/Dietician</Text>
          <View style={styles.messageItem}>
            <Text style={styles.messageText}>Great job on your last workout!</Text>
            <Text style={styles.messageMeta}>Coach • {new Date().toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Likes Modal */}
      <Modal visible={showLikesModal !== null} animationType="slide" transparent onRequestClose={() => setShowLikesModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Likes</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(null)}>
                <MaterialIcons name="close" size={24} color="#1d1d1f" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={showLikesModal ? postLikes[showLikesModal] : []}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.modalItemRow}>
                  <Image source={{ uri: item.avatar }} style={styles.modalAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>{item.name}</Text>
                    <Text style={styles.modalTime}>{item.time}</Text>
                  </View>
                  <MaterialIcons name="favorite" size={18} color="#ff3c20" />
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: '#6e6e73', textAlign: 'center', marginTop: 24 }}>No likes yet.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={showCommentsModal !== null} animationType="slide" transparent onRequestClose={() => setShowCommentsModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(null)}>
                <MaterialIcons name="close" size={24} color="#1d1d1f" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={showCommentsModal ? postComments[showCommentsModal] : []}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.modalItemRow}>
                  <Image source={{ uri: item.avatar }} style={styles.modalAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>{item.name}</Text>
                    <Text style={styles.modalTime}>{item.time}</Text>
                    <Text style={styles.modalComment}>{item.message}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <TouchableOpacity onPress={() => handleLikeComment(item.id)} style={{ marginRight: 12 }}>
                        <MaterialIcons name={commentLikes[item.id] ? 'favorite' : 'favorite-border'} size={18} color={commentLikes[item.id] ? '#ff3c20' : '#6e6e73'} />
                      </TouchableOpacity>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f7', borderRadius: 16, paddingHorizontal: 8 }}>
                        <TextInput
                          style={{ flex: 1, height: 32, fontSize: 13 }}
                          placeholder="Reply..."
                          value={replyInputs[item.id] || ''}
                          onChangeText={text => handleReplyInput(item.id, text)}
                        />
                        <TouchableOpacity onPress={() => handleReplySubmit(item.id)} style={{ marginLeft: 4 }}>
                          <MaterialIcons name="send" size={18} color="#ff3c20" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: '#6e6e73', textAlign: 'center', marginTop: 24 }}>No comments yet.</Text>}
            />
            {/* Like and Add Comment Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <TouchableOpacity style={{ marginRight: 12 }}>
                <MaterialIcons name="favorite" size={24} color="#ff3c20" />
                {/* Optionally show like count or state here */}
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f7', borderRadius: 20, paddingHorizontal: 12 }}>
                <TextInput
                  style={{ flex: 1, height: 40 }}
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChangeText={setCommentInput}
                />
                <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => {/* handle comment submit */}}>
                  <MaterialIcons name="send" size={22} color="#ff3c20" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modern Glassmorphic Footer */}
      <View style={footerStyles.footerContainer}>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => {}}
        >
          <MaterialIcons name="home-filled" size={28} color="#ff3c20" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('PlanNative')}
        >
          <MaterialIcons name="event" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('HealthDashboard')}
        >
          <MaterialIcons name="dashboard" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [footerStyles.iconBtn, pressed && footerStyles.iconBtnActive]}
          onPress={() => navigation.navigate('UserSettingsNative')}
        >
          <MaterialIcons name="person" size={26} color="#6e6e73" style={footerStyles.iconShadow} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}
