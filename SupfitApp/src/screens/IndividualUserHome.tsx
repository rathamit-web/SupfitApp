import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserHome } from '../hooks/useUserHome';
import type { UserHomeData, WorkoutPost } from '../types/userHome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_KEYS } from '../lib/subscriptionStorage';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import Toast from 'react-native-root-toast';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FooterNav from '../components/FooterNav';
import supabaseClient from '../../shared/supabaseClient';
import { useActiveHoursSync } from '../hooks/useActiveHoursSync';
import { useDailyMetricsSync } from '../hooks/useDailyMetricsSync';
import { getLocalActiveDateString } from '../health/activeHours';

function IndividualUserHome({ navigation, route }: any) {
  const [userId, setUserId] = useState<string | null>(null);

  const [todayActiveMinutes, setTodayActiveMinutes] = useState<number | null>(null);
  const [todayActiveSource, setTodayActiveSource] = useState<string | null>(null);
  const [todayActiveUpdatedAt, setTodayActiveUpdatedAt] = useState<string | null>(null);

  const fetchTodayActiveHours = useCallback(async () => {
    if (!userId) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const { data, error } = await supabaseClient
      .from('active_hours')
      .select('minutes_active, source, updated_at')
      .eq('owner_id', userId)
      .eq('active_date', todayStr)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch active_hours for today:', error);
      return;
    }

    if (!data) {
      setTodayActiveMinutes(null);
      setTodayActiveSource(null);
      setTodayActiveUpdatedAt(null);
      return;
    }

    setTodayActiveMinutes(typeof data.minutes_active === 'number' ? data.minutes_active : null);
    setTodayActiveSource(typeof data.source === 'string' ? data.source : null);
    setTodayActiveUpdatedAt(typeof data.updated_at === 'string' ? data.updated_at : null);
  }, [userId]);

  type DailyMetricsRecord = {
    steps: number | null;
    caloriesKcal: number | null;
    avgHrBpm: number | null;
    sleepMinutes: number | null;
    gymMinutes: number | null;
    badmintonMinutes: number | null;
    swimMinutes: number | null;
    source?: string | null;
    updatedAt?: string | null;
  };

  const [dailyMetricsRecord, setDailyMetricsRecord] = useState<DailyMetricsRecord | null>(null);
  const [dailyMetricsLoading, setDailyMetricsLoading] = useState(false);
  const [googleFitStatus, setGoogleFitStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [googleFitLoading, setGoogleFitLoading] = useState(false);

  const fetchDailyMetrics = useCallback(async () => {
    if (!userId) return;
    const metricDate = getLocalActiveDateString(new Date());
    setDailyMetricsLoading(true);
    const { data, error } = await supabaseClient
      .from('daily_metrics')
      .select('steps, calories_kcal, avg_hr_bpm, sleep_minutes, gym_minutes, badminton_minutes, swim_minutes, source, updated_at')
      .eq('owner_id', userId)
      .eq('metric_date', metricDate)
      .maybeSingle();

    if (!error && data) {
      setDailyMetricsRecord({
        steps: typeof data.steps === 'number' ? data.steps : null,
        caloriesKcal: typeof data.calories_kcal === 'number' ? data.calories_kcal : null,
        avgHrBpm: typeof data.avg_hr_bpm === 'number' ? data.avg_hr_bpm : null,
        sleepMinutes: typeof data.sleep_minutes === 'number' ? data.sleep_minutes : null,
        gymMinutes: typeof data.gym_minutes === 'number' ? data.gym_minutes : null,
        badmintonMinutes: typeof data.badminton_minutes === 'number' ? data.badminton_minutes : null,
        swimMinutes: typeof data.swim_minutes === 'number' ? data.swim_minutes : null,
        source: typeof data.source === 'string' ? data.source : null,
        updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
      });
    } else if (!data) {
      setDailyMetricsRecord(null);
    }
    setDailyMetricsLoading(false);
  }, [userId]);

  const fetchGoogleFitStatus = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabaseClient
      .from('source_connections')
      .select('status')
      .eq('owner_id', userId)
      .eq('provider', 'google_fit')
      .maybeSingle();

    if (data?.status === 'connected') {
      setGoogleFitStatus('connected');
    } else if (data?.status === 'disconnected') {
      setGoogleFitStatus('disconnected');
    } else {
      setGoogleFitStatus('unknown');
    }
  }, [userId]);

  useActiveHoursSync({
    onSynced: fetchTodayActiveHours,
  });

  const { syncToday: syncDailyMetrics } = useDailyMetricsSync({
    onSynced: fetchDailyMetrics,
  });
  useEffect(() => {
    async function fetchUserId() {
      const { data } = await supabaseClient.auth.getUser();
      if (data?.user?.id) {
        setUserId(data.user.id); // This is the UUID
        console.log('IndividualUserHome: userId fetched from supabaseClient.auth.getUser():', data.user.id);
      } else {
        console.warn('IndividualUserHome: No userId found in supabaseClient.auth.getUser() response:', data);
      }
    }
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchTodayActiveHours();
  }, [userId, fetchTodayActiveHours]);

  useEffect(() => {
    if (!userId) return;
    fetchDailyMetrics();
  }, [userId, fetchDailyMetrics]);

  useEffect(() => {
    if (!userId) return;
    fetchGoogleFitStatus();
  }, [userId, fetchGoogleFitStatus]);

  useEffect(() => {
    if (!userId) return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

    const DAILY_METRICS_SYNC_KEY = 'dailyMetricsLastSyncDate';
    const run = async () => {
      const todayKey = getLocalActiveDateString(new Date());
      const lastSync = await AsyncStorage.getItem(DAILY_METRICS_SYNC_KEY);
      if (lastSync === todayKey) return;

      const result = await syncDailyMetrics();
      if (result.ok) {
        await AsyncStorage.setItem(DAILY_METRICS_SYNC_KEY, todayKey);
      }
    };

    run();
  }, [userId, syncDailyMetrics]);

  // MIME type validation sets
  const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/avif',
  ]);
  const ALLOWED_VIDEO_MIME_TYPES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ]);
  function isAllowedImageType(
    mimeType: string | null | undefined,
    fileName: string | null | undefined,
  ): boolean {
    if (mimeType && ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return true;
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      return ['jpg','jpeg','png','webp','heic','avif'].includes(ext || '');
    }
    return false;
  }
  function extractWorkoutStoragePath(url?: string | null): string | null {
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
    const marker = `/${WORKOUT_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx < 0) return null;
    const start = idx + marker.length;
    const end = url.indexOf('?', start);
    return url.substring(start, end === -1 ? url.length : end);
  }
  function getMediaTypeFromPath(path?: string | null): 'image' | 'video' | null {
    if (!path) return null;
    const ext = path.split('.').pop()?.toLowerCase();
    if (!ext) return null;
    if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
    return 'image';
  }
  const MAX_FILE_SIZE_MB = 10;
  const MAX_VIDEO_SIZE_MB = 50;
  const WORKOUT_BUCKET = 'user-uploads';
  const DEFAULT_WORKOUT_IMAGE = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80';
  const BoltIcon = React.memo(() => <MaterialIcons name="bolt" size={24} color="#ff3c20" />);
  BoltIcon.displayName = 'BoltIcon';
  const GroupIcon = React.memo(() => <MaterialIcons name="group" size={24} color="#ff3c20" />);
  GroupIcon.displayName = 'GroupIcon';
  const TrendingUpIcon = React.memo(() => <MaterialIcons name="trending-up" size={24} color="#ff3c20" />);
  TrendingUpIcon.displayName = 'TrendingUpIcon';
  async function uploadImageToSupabase(uri: string, folder: string = 'profile-images'): Promise<string | null> {
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      if (!authData?.user?.id) {
        return null;
      }
      const userId = authData.user.id;
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      const filePath = `${folder}/${fileName}`;
      let blob: Blob;
      const response = await fetch(uri);
      blob = await response.blob();
      const bucket = folder === 'profile-images' ? 'Avatars' : 'User Uploads';
      const { error: uploadError } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      if (uploadError) {
        return null;
      }
      const { data: { publicUrl } } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);
      return publicUrl;
    } catch {
      return null;
    }
  }

  type SignedUrlCacheEntry = { url: string; expiresAt: number };
  const signedUrlCache = useMemo(() => new Map<string, SignedUrlCacheEntry>(), []);
  const getSignedUrlForPath = useCallback(
    async (path: string): Promise<string | null> => {
      if (!path) return null;
      const cached = signedUrlCache.get(path);
      if (cached && cached.expiresAt > Date.now()) return cached.url;
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const { data, error } = await supabaseClient.functions.invoke('get-signed-url', {
          body: { bucket: WORKOUT_BUCKET, path },
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        if (error) {
          const { data: fallback, error: fallbackError } = await supabaseClient.storage
            .from(WORKOUT_BUCKET)
            .createSignedUrl(path, 300);
          if (fallbackError) return null;
          if (fallback?.signedUrl) {
            signedUrlCache.set(path, { url: fallback.signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
          }
          return fallback?.signedUrl ?? null;
        }
        const signedUrl =
          (typeof data?.signedUrl === 'string' && data.signedUrl) ||
          (typeof data?.signed_url === 'string' && data.signed_url) ||
          (typeof data?.url === 'string' && data.url);
        if (signedUrl) {
          signedUrlCache.set(path, { url: signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
          return signedUrl;
        }
        const { data: fallback, error: fallbackError } = await supabaseClient.storage
          .from(WORKOUT_BUCKET)
          .createSignedUrl(path, 300);
        if (fallbackError) return null;
        if (fallback?.signedUrl) {
          signedUrlCache.set(path, { url: fallback.signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
        }
        return fallback?.signedUrl ?? null;
      } catch {
        return null;
      }
    },
    [signedUrlCache],
  );

  // Use userId in your hooks and queries, only if userId is loaded
  const { data, error, isLoading, isError, refetch, likePost } = useUserHome(userId ?? '');
  const typedUserHome = data as UserHomeData | undefined;
  const profile = typedUserHome?.profile;
  const workouts = useMemo(() => typedUserHome?.posts ?? [], [typedUserHome?.posts]);
  const dietPlan = typedUserHome?.dietPlan || { breakfast: '', lunch: '', dinner: '' };

  // Local UI state so interactions remain responsive even if backend/RLS blocks writes.
  type WorkoutPostWithMedia = WorkoutPost & { image_path?: string | null; media_type?: 'image' | 'video' | null };
  const [localPosts, setLocalPosts] = useState<WorkoutPostWithMedia[]>(workouts);
  useEffect(() => {
    let isMounted = true;
    const resolveMedia = async () => {
      if (!workouts || workouts.length === 0) {
        if (isMounted) setLocalPosts([]);
        return;
      }
      const resolved = await Promise.all(
        workouts.map(async (post) => {
          const canonicalPath = extractWorkoutStoragePath(post.image ?? null);
          const mediaType = getMediaTypeFromPath(canonicalPath ?? post.image ?? null);
          if (canonicalPath && !post.image?.startsWith('http')) {
            const signedUrl = await getSignedUrlForPath(canonicalPath);
            return {
              ...post,
              image: signedUrl ?? post.image,
              image_path: canonicalPath,
              media_type: mediaType,
            };
          }
          return {
            ...post,
            image_path: canonicalPath,
            media_type: mediaType,
          };
        }),
      );
      if (isMounted) setLocalPosts(resolved);
    };
    resolveMedia();
    return () => {
      isMounted = false;
    };
  }, [workouts, getSignedUrlForPath]);

  // Profile image state for upload (local only, source of truth is userHome.profile.avatarUrl)
  const [profileImage, setProfileImage] = useState<string | null>(null);
  useEffect(() => {
    if (profile?.avatarUrl) setProfileImage(profile.avatarUrl);
  }, [profile?.avatarUrl]);

  // User display name and subtitle (character)
  const [displayName, setDisplayName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.fullName || 'Fitness Titan');
      setSubtitle(profile.bio || 'Athlete • Coach • Runner');
    }
  }, [profile]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [addWorkoutModalVisible, setAddWorkoutModalVisible] = useState(false);
  const [newWorkoutText, setNewWorkoutText] = useState('');
  const [newCaptionText, setNewCaptionText] = useState('');

  // Feedback Modal State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedSubscriptionForFeedback, setSelectedSubscriptionForFeedback] = useState<SubscriptionCard | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackReview, setFeedbackReview] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Save user info to DB
  const handleSaveName = async () => {
    setSavingName(true);
    setEditModalVisible(false); // Close modal immediately on save
    try {
      if (!userId) {
        Toast.show('Please sign in again.', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
          backgroundColor: '#ff3b30',
          textColor: '#fff',
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
          animation: true,
          hideOnPress: true,
        });
        return;
      }

      // Persist to user_profiles (not users) to avoid permission issues and match schema.
      const { error } = await supabaseClient
        .from('user_profiles')
        .update({ full_name: editName, bio: editSubtitle })
        .eq('id', userId);

      if (error) throw error;

      setDisplayName(editName);
      setSubtitle(editSubtitle);
      Toast.show('✓ Profile updated', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: '#34c759',
        textColor: '#fff',
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
          : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
        animation: true,
        hideOnPress: true,
      });
    } catch {
      // Still update locally so the page remains usable.
      setDisplayName(editName);
      setSubtitle(editSubtitle);
      Toast.show('Saved locally (sync pending).', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: '#ff9f0a',
        textColor: '#fff',
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
          : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
        animation: true,
        hideOnPress: true,
      });
    } finally {
      setSavingName(false);
    }
  };
  const [isUploading, setIsUploading] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  // Removed unused commentingPostId state
  const [replyingTo, setReplyingTo] = useState<{ postId: number, commentId: number } | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const getNextWorkoutSlotId = () => {
    const ids = localPosts
      .map((post) => Number(post.id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const maxId = ids.length ? Math.max(...ids) : 0;
    return maxId + 1;
  };
  const handleAddWorkoutPost = async () => {
    if (!userId) {
      alert('Please sign in again.');
      return;
    }
    const workout = newWorkoutText.trim() || 'Workout';
    const caption = newCaptionText.trim();
    try {
      const nextSlotId = getNextWorkoutSlotId();
      const { data, error } = await supabaseClient
        .from('user_workouts')
        .insert({ user_id: userId, slot_id: nextSlotId, workout, caption, likes: 0, comments: 0 })
        .select('id')
        .maybeSingle();
      if (error || !data?.id) {
        throw error || new Error('Failed to create workout');
      }
      setLocalPosts((prev) => [
        { id: String(data.id), image: '', caption, workout, likes: 0, comments: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setAddWorkoutModalVisible(false);
      setNewWorkoutText('');
      setNewCaptionText('');
      await handleEditWorkoutImage(String(data.id));
    } catch {
      alert('Failed to add workout. Please try again.');
    }
  };

  // Likes and Comments Supabase integration
  const [likesData, setLikesData] = useState<{ id: number, name: string, avatar: string }[]>([]);
  const [commentsData, setCommentsData] = useState<{ id: number, name: string, avatar: string, message: string, likes: number }[]>([]);
  const [repliesData, setRepliesData] = useState<{ [commentId: number]: { id: number, name: string, avatar: string, message: string }[] }>({});
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: any) => {
      event.preventDefault();
      const error = event.reason || event.error || {};
      const errorMsg = String(error?.message || error || '');
      
      console.log('Unhandled rejection caught:', errorMsg);
      
      if (errorMsg.toLowerCase().includes('unsupported') || 
          errorMsg.includes('Only images') ||
          errorMsg.includes('application/') ||
          errorMsg.includes('document') ||
          errorMsg.includes('wordprocessing')) {
        Toast.show('⚠️ Invalid file type. Please select only JPEG or PNG images.', {
          duration: Toast.durations.LONG,
          position: Toast.positions.CENTER,
          backgroundColor: '#ff3b30',
          textColor: '#fff',
          // shadow removed for web compatibility
          ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
          animation: true,
          hideOnPress: true,
        });
      } else if (errorMsg) {
        Toast.show('⚠️ An error occurred. Please try again.', {
          duration: Toast.durations.LONG,
          position: Toast.positions.CENTER,
          backgroundColor: '#ff3b30',
          textColor: '#fff',
          // shadow removed for web compatibility
          ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
          animation: true,
          hideOnPress: true,
        });
      }
    };

    if (Platform.OS === 'web' && globalThis.window !== undefined && typeof globalThis.window.addEventListener === 'function') {
      globalThis.window.addEventListener('unhandledrejection', handleUnhandledRejection);
      return () => {
        globalThis.window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, []);

  /**
   * Shows success toast with consistent styling
   */
  const showSuccessToast = (message: string) => {
    Toast.show(message, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      backgroundColor: '#34c759',
      textColor: '#fff',
      // shadow removed for web compatibility
      ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
      animation: true,
      hideOnPress: true,
    });
  };

  /**
   * Handles profile image upload with validation and error handling
   */
  const handleEditProfileImage = async () => {
    setIsUploading(true);
    try {
      if (!profile) {
        alert('Profile not loaded. Please try again.');
        setIsUploading(false);
        return;
      }
      const AVATAR_BUCKET = 'Avatars';
      const PROFILE_FOLDER = 'profile-images';
      let oldAvatarUrl = profile.avatarUrl || null;
      let oldFilePath: string | null = null;
      if (oldAvatarUrl) {
        if (oldAvatarUrl.includes('/Avatars/')) {
          const urlParts = oldAvatarUrl.split('/Avatars/');
          if (urlParts.length > 1) {
            oldFilePath = urlParts[1].split('?')[0];
          }
        } else if (oldAvatarUrl.includes('/avatars/')) {
          const urlParts = oldAvatarUrl.split('/avatars/');
          if (urlParts.length > 1) {
            oldFilePath = urlParts[1].split('?')[0];
          }
        }
      }

      if (Platform.OS === 'web') {
        if (typeof document === 'undefined') {
          setIsUploading(false);
          return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return setIsUploading(false);
          // Resize/compress using canvas (web only, simple)
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              alert('Failed to process image.');
              setIsUploading(false);
              return;
            }
            ctx.drawImage(img, 0, 0, 512, 512);
            canvas.toBlob(async (blob) => {
              if (!blob) return setIsUploading(false);
              // Optimistic UI update
              const tempUrl = URL.createObjectURL(blob);
              setProfileImage(tempUrl);
              try {
                const uploadedUrl = await uploadImageToSupabase(tempUrl, PROFILE_FOLDER);
                if (!uploadedUrl) throw new Error('Upload failed');
                const cacheBustedUrl = `${uploadedUrl}?v=${Date.now()}`;
                await supabaseClient.from('user_profiles').update({ avatar_url: cacheBustedUrl }).eq('id', profile.id);
                setProfileImage(cacheBustedUrl);
                if (oldFilePath) {
                  await supabaseClient.storage.from(AVATAR_BUCKET).remove([oldFilePath]);
                }
                showSuccessToast('✓ Profile picture updated');
              } catch {
                alert('Failed to upload image. Please try again.');
              } finally {
                setIsUploading(false);
                URL.revokeObjectURL(tempUrl);
              }
            }, 'image/jpeg', 0.8);
          };
        };
        input.click();
        return;
      }
      // Native: Pick, compress, upload
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo access permission is required.');
        setIsUploading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
      });
      if (result.canceled) {
        setIsUploading(false);
        return;
      }
      const asset = result.assets[0];
      // Compress/resize
      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      // Optimistic UI update
      setProfileImage(manipResult.uri);
      const uploadedUrl = await uploadImageToSupabase(manipResult.uri, PROFILE_FOLDER);
      if (!uploadedUrl) throw new Error('Upload failed');
      const cacheBustedUrl = `${uploadedUrl}?v=${Date.now()}`;
      await supabaseClient.from('user_profiles').update({ avatar_url: cacheBustedUrl }).eq('id', profile.id);
      setProfileImage(cacheBustedUrl);
      if (oldFilePath) await supabaseClient.storage.from(AVATAR_BUCKET).remove([oldFilePath]);
      showSuccessToast('✓ Profile picture updated');
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper for web file input for profile image, also saves to DB
  // (Removed: now handled inline in handleEditProfileImage)




// (Removed: now handled inline in handleEditProfileImage)

// Removed unused readFileAndSetWorkoutImage

  /**
   * Handles workout image upload with validation and error handling
   */
  const handleEditWorkoutImage = async (workoutId: string) => {
    setIsUploading(true);
    try {
      if (!userId) {
        alert('Please sign in again.');
        setIsUploading(false);
        return;
      }
      if (Platform.OS === 'web') {
        if (typeof document === 'undefined') {
          setIsUploading(false);
          return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/avif,video/mp4,video/webm,video/quicktime';
        input.onchange = (e: any) => handleWorkoutFileInput(e, workoutId, setIsUploading);
        input.click();
        return;
      }
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo access permission is required.');
        setIsUploading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduced quality to compress image
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
      });
      if (result.canceled) {
        setIsUploading(false);
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        alert('No image selected.');
        setIsUploading(false);
        return;
      }
      const mimeType = typeof asset.mimeType === 'string' ? asset.mimeType : undefined;
      const isVideo = asset.type === 'video' || (mimeType ? ALLOWED_VIDEO_MIME_TYPES.has(mimeType) : false);
      if (!isVideo && !isAllowedImageType(mimeType ?? undefined, asset.fileName)) {
        alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) or videos (MP4, WebM, MOV) are allowed.');
        setIsUploading(false);
        return;
      }
      if (isVideo && mimeType && !ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
        alert('Only videos (MP4, WebM, MOV) are allowed.');
        setIsUploading(false);
        return;
      }
      if (asset.fileSize) {
        const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB;
        if (asset.fileSize > maxSize * 1024 * 1024) {
          const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
          alert(`File too large (${sizeMB}MB). Maximum size is ${maxSize}MB.`);
          setIsUploading(false);
          return;
        }
      }

      let uploadBlob: Blob;
      let filePath: string;
      if (isVideo) {
        const ext = asset.fileName?.split('.').pop()?.toLowerCase() || 'mp4';
        filePath = `${userId}/${workoutId}_${Date.now()}.${ext}`;
        const response = await fetch(asset.uri);
        uploadBlob = await response.blob();
      } else {
        const targetWidth = asset.width && asset.width > 1080 ? 1080 : asset.width ?? 1080;
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: targetWidth } }],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
        );
        if (!manipResult.uri) throw new Error('Failed to process the selected image.');
        const response = await fetch(manipResult.uri);
        uploadBlob = await response.blob();
        filePath = `${userId}/${workoutId}_${Date.now()}.jpg`;
      }

      const { error: uploadError } = await supabaseClient.storage
        .from(WORKOUT_BUCKET)
        .upload(filePath, uploadBlob, { contentType: mimeType || 'application/octet-stream', upsert: true });
      if (uploadError) throw uploadError;

      await supabaseClient
        .from('user_workouts')
        .update({ image_url: filePath, media_url: filePath, media_type: isVideo ? 'video' : 'image' })
        .eq('id', String(workoutId))
        .eq('user_id', userId);

      const signedUrl = await getSignedUrlForPath(filePath);
      setLocalPosts((prev) =>
        prev.map((p: any) =>
          String(p.id) === String(workoutId)
            ? { ...p, image: signedUrl ?? p.image, image_path: filePath, media_type: isVideo ? 'video' : 'image' }
            : p,
        ),
      );
      showSuccessToast('✓ Workout media updated');
      setIsUploading(false);
    } catch {
      alert('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };



  function handleWorkoutFileInput(
    e: any,
    workoutId: string,
    setUploading: (v: boolean) => void
  ) {
    const file = e.target?.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }
    if (!userId) {
      alert('Please sign in again.');
      setUploading(false);
      return;
    }
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.has(file.type);
    if (!isVideo && !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) or videos (MP4, WebM, MOV) are allowed.');
      setUploading(false);
      return;
    }
    const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB;
    if (file.size > maxSize * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`File too large (${sizeMB}MB). Maximum size is ${maxSize}MB.`);
      setUploading(false);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
    const filePath = `${userId}/${workoutId}_${Date.now()}.${ext}`;
    supabaseClient.storage
      .from(WORKOUT_BUCKET)
      .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: true })
      .then(async ({ error: uploadError }) => {
        if (uploadError) throw uploadError;
        await supabaseClient
          .from('user_workouts')
          .update({ image_url: filePath, media_url: filePath, media_type: isVideo ? 'video' : 'image' })
          .eq('id', String(workoutId))
          .eq('user_id', userId);
        const signedUrl = await getSignedUrlForPath(filePath);
        setLocalPosts((prev) =>
          prev.map((p: any) =>
            String(p.id) === String(workoutId)
              ? { ...p, image: signedUrl ?? p.image, image_path: filePath, media_type: isVideo ? 'video' : 'image' }
              : p,
          ),
        );
        showSuccessToast('✓ Workout media updated');
        setUploading(false);
      })
      .catch(() => {
        alert('Failed to upload image. Please try again.');
        setUploading(false);
      });
  }

  const activeHoursFromDerived =
    typeof todayActiveMinutes === 'number' ? (todayActiveMinutes / 60).toFixed(1) : null;

  // Stats prefer derived daily totals if available; otherwise fallback to profile.stats
  const stats = profile?.stats
    ? [
        { label: 'Active Hours', value: activeHoursFromDerived ?? profile.stats.activeHours, unit: 'hrs', icon: BoltIcon },
        { label: 'Followers', value: profile.stats.followers, icon: GroupIcon },
        { label: 'Rewards', value: profile.stats.rewards, unit: '🏆', icon: TrendingUpIcon },
      ]
    : [
        { label: 'Active Hours', value: activeHoursFromDerived ?? '0', unit: 'hrs', icon: BoltIcon },
        { label: 'Followers', value: '0', icon: GroupIcon },
        { label: 'Rewards', value: '0', unit: '🏆', icon: TrendingUpIcon },
      ];

  const formatDuration = (minutes: number | null | undefined) => {
    const safeMinutes = typeof minutes === 'number' && Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    if (safeMinutes >= 60) {
      const hours = safeMinutes / 60;
      return `${hours.toFixed(1)} hr`;
    }
    return `${Math.round(safeMinutes)} min`;
  };

  const formatSleep = (minutes: number | null | undefined) => {
    const safeMinutes = typeof minutes === 'number' && Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    const hours = Math.floor(safeMinutes / 60);
    const mins = Math.round(safeMinutes % 60);
    return `${hours}h ${mins}m`;
  };

  const stepsValue = dailyMetricsRecord?.steps ?? 0;
  const stepsTarget = 10000;
  const stepsProgress = stepsTarget > 0 ? Math.min(100, Math.round((stepsValue / stepsTarget) * 100)) : 0;

  const dailyMetricsUpdatedLabel = dailyMetricsRecord?.updatedAt
    ? new Date(dailyMetricsRecord.updatedAt).toLocaleTimeString()
    : 'Unknown';

  const dailyMetricsSourceLabel = dailyMetricsRecord?.source ? dailyMetricsRecord.source : 'unknown';

  const handleConnectGoogleFit = async () => {
    if (!userId) return;
    setGoogleFitLoading(true);
    try {
      const { data, error } = await supabaseClient.functions.invoke('google-fit-auth-start');
      if (error || !data?.url) {
        Toast.show('Unable to start Google Fit connection.', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
          backgroundColor: '#ff3b30',
          textColor: '#fff',
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
            : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
        });
        return;
      }

      await WebBrowser.openBrowserAsync(data.url);
      await fetchGoogleFitStatus();
    } finally {
      setGoogleFitLoading(false);
    }
  };

  const handlePullGoogleFitMetrics = async () => {
    if (!userId) return;
    setGoogleFitLoading(true);
    try {
      await supabaseClient.functions.invoke('google-fit-pull-daily-metrics', {
        body: { metricDate: getLocalActiveDateString(new Date()) },
      });
      await fetchDailyMetrics();
    } finally {
      setGoogleFitLoading(false);
    }
  };

  const dailyMetrics = [
    {
      label: 'Steps',
      value: stepsValue.toLocaleString(),
      target: stepsTarget.toLocaleString(),
      progress: stepsProgress,
    },
    {
      label: 'Gym',
      value: formatDuration(dailyMetricsRecord?.gymMinutes),
      completed: (dailyMetricsRecord?.gymMinutes ?? 0) > 0,
    },
    {
      label: 'Badminton',
      value: formatDuration(dailyMetricsRecord?.badmintonMinutes),
      completed: (dailyMetricsRecord?.badmintonMinutes ?? 0) > 0,
    },
    {
      label: 'Swim',
      value: formatDuration(dailyMetricsRecord?.swimMinutes),
      completed: (dailyMetricsRecord?.swimMinutes ?? 0) > 0,
    },
    {
      label: 'Calories',
      value: `${(dailyMetricsRecord?.caloriesKcal ?? 0).toLocaleString()} kcal`,
    },
    {
      label: 'Avg HR',
      value: `${(dailyMetricsRecord?.avgHrBpm ?? 0).toLocaleString()} bpm`,
    },
    {
      label: 'Sleep',
      value: formatSleep(dailyMetricsRecord?.sleepMinutes),
    },
  ];

  // Note: Weekly schedule state and navigation/focus logic removed (legacy, not from userHome)

  type SubscriptionKind = 'gym' | 'coach' | 'dietician';
  type SubscriptionStatus = 'paid' | 'unpaid';

  type SubscriptionCard = {
    id: SubscriptionKind;
    typeLabel: string;
    name: string;
    status: SubscriptionStatus;
    amount: string;
    validUpto?: string | null;
    packageName?: string | null;
    navigateTo: 'SelectGymNative' | 'SelectCoachNative' | 'SelectDieticianNative';
  };

  const defaultSubscriptions = useMemo<SubscriptionCard[]>(
    () => [
      {
        id: 'gym',
        typeLabel: 'My Gym',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        validUpto: null,
        packageName: null,
        navigateTo: 'SelectGymNative',
      },
      {
        id: 'coach',
        typeLabel: 'Gym Coach',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        validUpto: null,
        packageName: null,
        navigateTo: 'SelectCoachNative',
      },
      {
        id: 'dietician',
        typeLabel: 'Dietician',
        name: 'Not Selected',
        status: 'unpaid',
        amount: '₹0',
        validUpto: null,
        packageName: null,
        navigateTo: 'SelectDieticianNative',
      },
    ],
    [],
  );

  const [subscriptions, setSubscriptions] = useState<SubscriptionCard[]>(defaultSubscriptions);
  const [expandedSubscriptions, setExpandedSubscriptions] = useState<Set<SubscriptionKind>>(new Set());

  const toggleSubscriptionExpanded = (id: SubscriptionKind) => {
    const next = new Set(expandedSubscriptions);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedSubscriptions(next);
  };

  // Feedback Submit Handler - Aligned to professional_reviews table structure
  const handleSubmitFeedback = async () => {
    if (!selectedSubscriptionForFeedback || !userId) {
      Toast.show('Error: Cannot submit feedback', {
        duration: Toast.durations.SHORT,
        backgroundColor: '#FF3C20',
      });
      return;
    }

    // Validate feedback
    const feedbackText = feedbackReview.trim();
    if (!feedbackText) {
      Toast.show('Please write a review', {
        duration: Toast.durations.SHORT,
        backgroundColor: '#FF9800',
      });
      return;
    }

    if (feedbackRating < 1 || feedbackRating > 5) {
      Toast.show('Please select a rating (1-5 stars)', {
        duration: Toast.durations.SHORT,
        backgroundColor: '#FF9800',
      });
      return;
    }

    setFeedbackSubmitting(true);
    
    try {
      // Get user's subscription details to map to professional_package_id
      const subscriptionType = selectedSubscriptionForFeedback.id; // 'coach', 'dietician', 'gym'
      const storageKey = SUBSCRIPTION_KEYS[subscriptionType];
      const subscriptionData = await AsyncStorage.getItem(storageKey);
      
      if (!subscriptionData) {
        throw new Error('Subscription data not found');
      }

      const parsedData = JSON.parse(subscriptionData);
      const professionalPackageId = parsedData.id || parsedData.professional_package_id;

      if (!professionalPackageId) {
        throw new Error('Professional package ID not found');
      }

      // Get user's name from profile
      const { data: userProfile } = await supabaseClient
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();

      const reviewerName = userProfile?.full_name || 'Anonymous User';

      // Fetch professional details for context
      const { data: professionalDetails } = await supabaseClient
        .from('professional_packages')
        .select('id, professional_id, name, description, specialties, mode')
        .eq('id', professionalPackageId)
        .single();

      // Build feedback metadata with professional context
      const feedbackData = {
        professional_package_id: professionalPackageId,
        reviewer_user_id: userId,
        reviewer_name: reviewerName,
        rating: parseFloat(feedbackRating.toFixed(2)), // NUMERIC(3,2) format
        title: 'User Feedback',
        content: feedbackText,
        status: 'pending', // Awaits professional approval
        helpful_count: 0,
        // Additional context for professionals
        professional_name: professionalDetails?.name || 'Professional',
        subscription_type: subscriptionType, // 'coach', 'dietician', 'gym'
        subscription_package: selectedSubscriptionForFeedback.packageName || 'Premium',
      };

      // Insert feedback into professional_reviews table
      const { error } = await supabaseClient
        .from('professional_reviews')
        .insert([feedbackData]);

      if (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }

      // Success
      Toast.show('✓ Feedback submitted for review!',{
        duration: Toast.durations.SHORT,
        backgroundColor: '#4CAF50',
      });

      // Reset form and close modal
      setFeedbackModalVisible(false);
      setSelectedSubscriptionForFeedback(null);
      setFeedbackRating(5);
      setFeedbackReview('');
    } catch (error) {
      console.error('Feedback submission error:', error);
      Toast.show('Failed to submit feedback. Please try again.', {
        duration: Toast.durations.SHORT,
        backgroundColor: '#FF3C20',
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const loadSubscriptionsFromStorage = useCallback(async () => {
    try {
      const [gymRaw, coachRaw, dieticianRaw] = await Promise.all([
        AsyncStorage.getItem(SUBSCRIPTION_KEYS.gym),
        AsyncStorage.getItem(SUBSCRIPTION_KEYS.coach),
        AsyncStorage.getItem(SUBSCRIPTION_KEYS.dietician),
      ]);

      const next = [...defaultSubscriptions];

      const apply = (idx: number, raw: string | null) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const amountNumber = typeof parsed?.amount === 'number' ? parsed.amount : Number(parsed?.amount);
        const amount = Number.isFinite(amountNumber) ? `₹${amountNumber.toLocaleString()}` : (parsed?.amount ? `₹${String(parsed.amount)}` : '₹0');

        next[idx] = {
          ...next[idx],
          name: parsed?.name || next[idx].name,
          status: parsed?.status === 'paid' ? 'paid' : 'unpaid',
          amount,
          validUpto: parsed?.validUpto ?? null,
          packageName: parsed?.packageName ?? null,
        };
      };

      apply(0, gymRaw);
      apply(1, coachRaw);
      apply(2, dieticianRaw);

      setSubscriptions(next);
    } catch {
      setSubscriptions(defaultSubscriptions);
    }
  }, [defaultSubscriptions]);

  useEffect(() => {
    loadSubscriptionsFromStorage();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadSubscriptionsFromStorage();
    });
    return unsubscribe;
  }, [navigation, loadSubscriptionsFromStorage]);

  // (Legacy dietPlan removed; now from useUserHome)

  // Fetch likes for a workout post
  const fetchLikes = async (postId: number) => {
    setLoadingLikes(true);
    try {
      const { data, error } = await supabaseClient
        .from('workout_likes')
        .select('id, user_id')
        .eq('workout_id', postId);
      if (error) throw error;

      setLikesData(
        (data || []).map((row: any, idx: number) => ({
          id: Number(row.id ?? idx),
          name: 'User',
          avatar: '',
        }))
      );
    } catch {
      // Local fallback on error
      setLikesData([
        { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
        { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
      ]);
    } finally {
      setLoadingLikes(false);
    }
  };

  // Fetch comments for a workout post
  const fetchComments = async (postId: number) => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabaseClient
        .from('workout_comments')
        .select('id, user_id, message, likes')
        .eq('workout_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      setCommentsData(
        (data || []).map((row: any) => ({
          id: Number(row.id),
          name: 'User',
          avatar: '',
          message: String(row.message || ''),
          likes: Number(row.likes || 0),
        }))
      );
    } catch {
      setCommentsData([
        {
          id: 1,
          name: 'Sarah Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
          message: 'Amazing workout! Keep it up!',
          likes: 2,
        },
      ]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch replies for a comment
  const fetchReplies = async (commentId: number) => {
    try {
      const { data, error } = await supabaseClient
        .from('workout_comment_replies')
        .select('id, user_id, message')
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setRepliesData(prev => ({
        ...prev,
        [commentId]: (data || []).map((row: any) => ({
          id: Number(row.id),
          name: 'User',
          avatar: '',
          message: String(row.message || ''),
        })),
      }));
    } catch {
      setRepliesData(prev => ({
        ...prev,
        [commentId]: prev[commentId] || [],
      }));
    }
  };

  // Add a comment
  const addComment = async (postId: number, userIdForInsert: string | null, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Optimistic/local append
    setCommentsData((prev) => [
      ...prev,
      { id: Date.now(), name: 'You', avatar: '', message: trimmed, likes: 0 },
    ]);

    if (!userIdForInsert) return;
    try {
      await supabaseClient.from('workout_comments').insert({ workout_id: postId, user_id: userIdForInsert, message: trimmed });
      fetchComments(postId);
    } catch {
      // Keep local-only
    }
  };

  // Add a reply
  const addReply = async (commentId: number, userIdForInsert: string | null, message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setRepliesData((prev) => ({
      ...prev,
      [commentId]: [
        ...(prev[commentId] || []),
        { id: Date.now(), name: 'You', avatar: '', message: trimmed },
      ],
    }));

    if (!userIdForInsert) return;
    try {
      await supabaseClient.from('workout_comment_replies').insert({ comment_id: commentId, user_id: userIdForInsert, message: trimmed });
      fetchReplies(commentId);
    } catch {
      // Keep local-only
    }
  };

  // Like a comment
  const likeComment = async (commentId: number, userIdForInsert: string | null) => {
    setCommentsData((prev) => prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c)));
    if (!userIdForInsert) return;
    try {
      await supabaseClient.rpc('like_comment', { comment_id: commentId, user_id: userIdForInsert });
      if (showCommentsModal !== null) fetchComments(showCommentsModal);
    } catch {
      // Keep local-only
    }
  };

  // When opening Likes modal, fetch likes
  useEffect(() => {
    if (showLikesModal !== null) fetchLikes(showLikesModal);
  }, [showLikesModal]);

  // When opening Comments modal, fetch comments
  useEffect(() => {
    if (showCommentsModal !== null) fetchComments(showCommentsModal);
  }, [showCommentsModal]);

  // When opening reply input, fetch replies for that comment
  useEffect(() => {
    if (replyingTo?.commentId) fetchReplies(replyingTo.commentId);
  }, [replyingTo]);

  // Loading and error UI for robust, resilient experience
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#888' }}>Loading...</Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#ff3c20', marginBottom: 12 }}>Failed to load data</Text>
        <Text style={{ color: '#888', marginBottom: 20 }}>{error?.message || 'Unknown error'}</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ backgroundColor: '#ff3c20', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={['#f8f9fa', '#f5f5f7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeaderWrap}>
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.avatarWrap}
              activeOpacity={0.8}
              onPress={handleEditProfileImage}
              disabled={isUploading}
              accessibilityLabel="Edit profile picture"
              accessibilityHint="Double tap to select a new profile picture"
              accessibilityRole="button"
            >
              <Image
                  source={profileImage ? { uri: profileImage } : undefined}
                  style={styles.avatarImg}
                  resizeMode="cover"
                  fadeDuration={0}
                  accessibilityLabel="Profile picture"
                  accessibilityHint="Double tap to change your profile picture"
                />
                <View style={styles.imageEditOverlay}>
                  <MaterialIcons name="edit" size={18} color="#ff3c20" />
                </View>
                {isUploading && (
                  <View style={styles.uploadingOverlayCircle}>
                    <Text style={styles.uploadingText}>...</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{displayName}</Text>
                  <Text style={styles.profileSubtitle}>{subtitle}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setEditName(displayName);
                    setEditSubtitle(subtitle);
                    setEditModalVisible(true);
                  }}
                  style={{ marginLeft: 8, padding: 6, borderRadius: 16, backgroundColor: '#fff', elevation: 2 }}
                  accessibilityLabel="Edit display name"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="edit" size={20} color="#ff3c20" />
                </TouchableOpacity>
              </View>
              {/* Edit Name Modal */}
              <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setEditModalVisible(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 280, elevation: 4 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Edit Profile Info</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Display Name</Text>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15 }}
                        placeholder="Enter your name"
                      />
                      <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Character / Subtitle</Text>
                      <TextInput
                        value={editSubtitle}
                        onChangeText={setEditSubtitle}
                        style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 18, fontSize: 15 }}
                        placeholder="e.g. Athlete • Coach • Runner"
                      />
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                          onPress={() => setEditModalVisible(false)}
                          style={{ flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 12, alignItems: 'center' }}
                          accessibilityLabel="Cancel edit"
                        >
                          <Text style={{ fontWeight: '600', color: '#333' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSaveName}
                          style={{ flex: 1, backgroundColor: '#ff3c20', borderRadius: 8, padding: 12, alignItems: 'center' }}
                          disabled={savingName}
                          accessibilityLabel="Save changes"
                        >
                          <Text style={{ fontWeight: '600', color: '#fff' }}>{savingName ? 'Saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
          </View>

          <View style={styles.statsRow}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View key={stat.label} style={styles.statCard}>
                  <View style={styles.statIconWrap}><Icon /></View>
                  <Text style={styles.statValue}>
                    {stat.value}
                    {stat.unit && <Text style={styles.statUnit}> {stat.unit}</Text>}
                  </Text>
                  {stat.label === 'Active Hours' && todayActiveMinutes !== null && (
                    <Text style={styles.statMeta}>
                      {todayActiveSource ? `Source: ${todayActiveSource}` : 'Source: unknown'}
                      {todayActiveUpdatedAt ? ` • Updated ${new Date(todayActiveUpdatedAt).toLocaleTimeString()}` : ''}
                    </Text>
                  )}
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity
              onPress={() => setAddWorkoutModalVisible(true)}
              style={styles.addWorkoutButton}
              accessibilityLabel="Add workout"
              accessibilityHint="Double tap to add a new workout"
            >
              <MaterialIcons name="add-circle" size={22} color="#ff3c20" />
              <Text style={styles.addWorkoutButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%' }}>
            {localPosts.length === 0 ? (
              <View style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}> 
                <View style={styles.postImageContainer}>
                  <Image
                    source={{ uri: DEFAULT_WORKOUT_IMAGE }}
                    style={styles.postImage}
                    resizeMode="cover"
                    fadeDuration={0}
                    accessibilityLabel="Default workout image"
                  />
                </View>
                <View style={styles.postContent}>
                  <Text style={styles.postWorkout}>Workout</Text>
                  <Text style={styles.postCaption}>Share your first workout.</Text>
                  <View style={styles.postStatsRow}>
                    <TouchableOpacity
                      onPress={() => setAddWorkoutModalVisible(true)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      accessibilityLabel="Add workout"
                    >
                      <MaterialIcons name="add-circle" size={18} color="#ff3c20" />
                      <Text style={{ marginLeft: 6, color: '#ff3c20', fontWeight: '600' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : localPosts.map((post) => (
              <View key={post.id} style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}> 
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleEditWorkoutImage(String(post.id))}
                  disabled={isUploading}
                  accessibilityLabel={`Edit ${post.workout} workout image`}
                  accessibilityHint="Double tap to select a new image for this workout"
                >
                  <View style={styles.postImageContainer}>
                    <Image
                      source={post.image ? { uri: post.image } : { uri: DEFAULT_WORKOUT_IMAGE }}
                      style={styles.postImage}
                      resizeMode="cover"
                      fadeDuration={0}
                      accessibilityLabel={`${post.workout} workout image`}
                      accessibilityHint="Double tap to change this workout image"
                    />
                    {post.media_type === 'video' && (
                      <View style={styles.videoBadge}>
                        <MaterialIcons name="play-arrow" size={20} color="#fff" />
                      </View>
                    )}
                    {post.media_type === 'video' && (
                      <View style={styles.videoBadge}>
                        <MaterialIcons name="play-circle-filled" size={32} color="#ffffff" />
                      </View>
                    )}
                    <View style={styles.imageEditOverlay} accessibilityRole="button" accessibilityLabel="Edit workout image">
                      <MaterialIcons name="edit" size={16} color="#ff3c20" />
                    </View>
                    {isUploading && (
                      <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.postContent}>
                  <Text style={styles.postWorkout}>{post.workout}</Text>
                  <Text style={styles.postCaption}>{post.caption}</Text>
                  <View style={styles.postStatsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        // Always update UI immediately; attempt backend mutation if available.
                        setLocalPosts((prev) =>
                          prev.map((p: any) => (p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p)),
                        );
                        if (userId && !likePost.isPending) {
                          likePost.mutate({ postId: post.id, idempotencyKey: `${userId}_${post.id}` });
                        }
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                      accessibilityLabel="Like post"
                      accessibilityHint="Double tap to like this workout"
                      accessibilityRole="button"
                      disabled={likePost.isPending}
                    >
                      <MaterialIcons name="favorite" size={18} color="#ff3c20" />
                      <Text style={{ marginLeft: 4, color: '#6e6e73' }}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowLikesModal(Number(post.id))}
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                      accessibilityLabel="Show likes"
                      accessibilityHint="Double tap to view who liked this workout"
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="people" size={18} color="#6e6e73" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowCommentsModal(Number(post.id))}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      accessibilityLabel="Show comments"
                      accessibilityHint="Double tap to view comments for this workout"
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="chat-bubble-outline" size={18} color="#6e6e73" />
                      <Text style={{ marginLeft: 4, color: '#6e6e73' }}>{post.comments}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Metrics Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Daily Metrics</Text>
          <Text style={styles.sectionSubtitle}>
            Source: {dailyMetricsSourceLabel} • Updated {dailyMetricsUpdatedLabel}
          </Text>
          {dailyMetricsLoading && (
            <Text style={{ marginTop: 6, color: '#6e6e73', fontSize: 12 }}>Refreshing…</Text>
          )}
          {Platform.OS === 'android' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {googleFitStatus !== 'connected' ? (
                <TouchableOpacity
                  onPress={handleConnectGoogleFit}
                  disabled={googleFitLoading}
                  style={[styles.subscriptionExpandButton, { paddingVertical: 8, paddingHorizontal: 12 }]}
                  accessibilityLabel="Connect Google Fit"
                >
                  <Text style={styles.subscriptionExpandButtonText}>
                    {googleFitLoading ? 'Connecting…' : 'Connect Google Fit'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handlePullGoogleFitMetrics}
                  disabled={googleFitLoading}
                  style={[styles.subscriptionExpandButton, { paddingVertical: 8, paddingHorizontal: 12 }]}
                  accessibilityLabel="Refresh Google Fit metrics"
                >
                  <Text style={styles.subscriptionExpandButtonText}>
                    {googleFitLoading ? 'Syncing…' : 'Refresh from Google Fit'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {dailyMetrics.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                {metric.target && (
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${metric.progress}%` }]} />
                  </View>
                )}
              </View>
              <View style={styles.metricRight}>
                <Text style={styles.metricValue}>{metric.value}</Text>
                {metric.target && <Text style={styles.metricTarget}>/ {metric.target}</Text>}
                {metric.completed && <Text style={styles.metricCompleted}>✓ Done</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Subscriptions Section - Modern Card Layout */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Subscriptions</Text>
          
          {/* Active Subscriptions - Hero Cards */}
          <View style={styles.activeSubscriptionsContainer}>
            {subscriptions
              .filter(sub => sub.status === 'paid')
              .map((sub) => (
                <View key={sub.id} style={styles.subscriptionHeroCard}>
                  <LinearGradient
                    colors={['#ff5944', '#ff3c20']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.subscriptionHeroGradient}
                  >
                    <View style={styles.subscriptionHeroTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subscriptionHeroTitle}>{sub.typeLabel}</Text>
                        <Text style={styles.subscriptionHeroPackage}>{sub.packageName || 'Premium'}</Text>
                      </View>
                      <MaterialIcons
                        name={sub.id === 'gym' ? 'fitness-center' : sub.id === 'coach' ? 'person' : 'restaurant'}
                        size={32}
                        color="#fff"
                      />
                    </View>

                    <View style={styles.subscriptionHeroBottom}>
                      <View>
                        <Text style={styles.subscriptionHeroRenewLabel}>RENEWS ON</Text>
                        <Text style={styles.subscriptionHeroRenewDate}>
                          {sub.validUpto ? new Date(sub.validUpto).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.subscriptionHeroButtonGroup}>
                        <TouchableOpacity
                          style={styles.subscriptionCapsuleButton}
                          onPress={() => navigation?.navigate?.(sub.navigateTo)}
                          accessibilityLabel={`Modify ${sub.typeLabel} subscription`}
                          accessibilityRole="button"
                        >
                          <MaterialIcons name="edit" size={16} color="#fff" />
                          <Text style={styles.subscriptionCapsuleButtonText}>MODIFY</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.subscriptionCapsuleButton}
                          onPress={() => {
                            setSelectedSubscriptionForFeedback(sub);
                            setFeedbackModalVisible(true);
                            setFeedbackRating(5);
                            setFeedbackReview('');
                          }}
                          accessibilityLabel={`Send feedback for ${sub.typeLabel}`}
                          accessibilityRole="button"
                        >
                          <MaterialIcons name="rate-review" size={16} color="#fff" />
                          <Text style={styles.subscriptionCapsuleButtonText}>FEEDBACK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
          </View>

          {/* Inactive Subscriptions - Available Services */}
          {subscriptions.some(sub => sub.status !== 'paid') && (
            <View style={styles.availableServicesContainer}>
              <Text style={styles.availableServicesTitle}>AVAILABLE SERVICES</Text>
              <View style={styles.availableServicesGrid}>
                {subscriptions
                  .filter(sub => sub.status !== 'paid')
                  .map((sub) => (
                    <View key={sub.id} style={styles.serviceCard}>
                      <View style={styles.serviceCardTop}>
                        <View style={styles.serviceIconContainer}>
                          <MaterialIcons
                            name={sub.id === 'gym' ? 'location-city' : sub.id === 'coach' ? 'person-outline' : 'restaurant-menu'}
                            size={24}
                            color="#ff3c20"
                          />
                        </View>
                        <Text style={styles.serviceCardTitle}>{sub.typeLabel}</Text>
                      </View>
                      <Text style={styles.serviceCardDescription}>
                        {sub.id === 'gym' ? 'Book your fitness center'
                          : sub.id === 'coach' ? 'Get coach your workout'
                          : 'Meal plans from expert'}
                      </Text>
                      <TouchableOpacity
                        style={styles.serviceCardButton}
                        onPress={() => navigation?.navigate?.(sub.navigateTo)}
                      >
                        <Text style={styles.serviceCardButtonText}>FIND ONE</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </View>


        {/* Diet Recommendation Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Diet Recommendation</Text>
          <View style={styles.dietGrid}>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Breakfast</Text>
              <Text style={styles.dietMealText}>{dietPlan.breakfast}</Text>
            </View>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Lunch</Text>
              <Text style={styles.dietMealText}>{dietPlan.lunch}</Text>
            </View>
            <View style={styles.dietCard}>
              <Text style={styles.dietMealTitle}>Dinner</Text>
              <Text style={styles.dietMealText}>{dietPlan.dinner}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Workout Modal */}
      <Modal
        visible={addWorkoutModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddWorkoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Workout</Text>
            <Text style={styles.modalText}>Workout</Text>
            <TextInput
              value={newWorkoutText}
              onChangeText={setNewWorkoutText}
              style={styles.modalInput}
              placeholder="e.g., Strength, Cardio"
            />
            <Text style={styles.modalText}>Caption</Text>
            <TextInput
              value={newCaptionText}
              onChangeText={setNewCaptionText}
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Write a caption..."
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setAddWorkoutModalVisible(false);
                  setNewWorkoutText('');
                  setNewCaptionText('');
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
                accessibilityLabel="Cancel add workout"
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await handleAddWorkoutPost();
                  // handleAddWorkoutPost already triggers media picker after DB insert
                }}
                style={[styles.modalButton, styles.modalButtonSave]}
                accessibilityLabel="Choose workout media"
              >
                <Text style={styles.modalButtonTextSave}>Choose Media</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Likes Bottom Sheet */}
      {showLikesModal !== null && (
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Likes</Text>
              <TouchableOpacity onPress={() => setShowLikesModal(null)} accessibilityLabel="Close likes sheet">
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingLikes ? (
              <Text style={{ textAlign: 'center', marginVertical: 20 }}>Loading...</Text>
            ) : likesData.map(like => (
              <View key={like.id} style={styles.sheetRow}>
                <Image 
                  source={like.avatar ? { uri: like.avatar } : undefined}
                  style={styles.sheetAvatar} 
                  resizeMode="cover"
                  fadeDuration={0}
                  accessibilityLabel={`${like.name} avatar`}
                />
                <Text style={styles.sheetName}>{like.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Comments Bottom Sheet */}
      {showCommentsModal !== null && (
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentsModal(null)} accessibilityLabel="Close comments sheet">
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingComments ? (
              <Text style={{ textAlign: 'center', marginVertical: 20 }}>Loading...</Text>
            ) : commentsData.map(comment => (
              <View key={comment.id} style={styles.sheetRow}>
                <Image 
                  source={comment.avatar ? { uri: comment.avatar } : undefined}
                  style={styles.sheetAvatar} 
                  resizeMode="cover"
                  fadeDuration={0}
                  accessibilityLabel={`${comment.name} avatar`}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetName}>{comment.name}</Text>
                  <Text style={styles.sheetComment}>{comment.message}</Text>
                  {/* Replies */}
                  {repliesData[comment.id]?.length > 0 && (
                    <View style={styles.replyList}>
                      {repliesData[comment.id].map(reply => (
                        <View key={reply.id} style={styles.replyRow}>
                          <Image 
                            source={reply.avatar ? { uri: reply.avatar } : undefined}
                            style={styles.replyAvatar} 
                            resizeMode="cover"
                            fadeDuration={0}
                            accessibilityLabel={`${reply.name} avatar`}
                          />
                          <Text style={styles.replyName}>{reply.name}:</Text>
                          <Text style={styles.replyText}>{reply.message}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {/* Reply input */}
                  {replyingTo?.postId === showCommentsModal && replyingTo?.commentId === comment.id ? (
                    <View style={styles.replyInputRow}>
                      <TextInput
                        style={styles.replyInput}
                        value={replyInput}
                        onChangeText={setReplyInput}
                        placeholder="Write a reply..."
                        placeholderTextColor="#aaa"
                      />
                      <TouchableOpacity
                        style={styles.replySendBtn}
                        onPress={() => {
                          addReply(comment.id, userId, replyInput);
                          setReplyInput('');
                          setReplyingTo(null);
                        }}
                        accessibilityLabel="Send reply"
                      >
                        <Text style={styles.replySendText}>Send</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => setReplyingTo({ postId: showCommentsModal, commentId: comment.id })}
                      accessibilityLabel="Reply to comment"
                    >
                      <Text style={styles.replyBtnText}>Reply</Text>
                    </TouchableOpacity>
                  )}
                </View>
                  <TouchableOpacity style={styles.commentLikeBtn} accessibilityLabel="Like comment" onPress={() => likeComment(comment.id, userId)}>
                  <Text style={styles.commentLikeText}>♥ {comment.likes}</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.commentInputRow}>
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/men/11.jpg' }} 
                style={styles.sheetAvatar} 
                resizeMode="cover"
                fadeDuration={0}
                accessibilityLabel="Your avatar"
              />
              <TextInput
                style={styles.commentInput}
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#aaa"
                // onFocus removed: setCommentingPostId no longer exists
              />
              <TouchableOpacity
                style={styles.commentSendBtn}
                onPress={() => {
                  addComment(showCommentsModal, userId, commentInput);
                  setCommentInput('');
                }}
                accessibilityLabel="Send comment"
              >
                <Text style={styles.commentSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setFeedbackModalVisible(false);
          setSelectedSubscriptionForFeedback(null);
          setFeedbackRating(5);
          setFeedbackReview('');
        }}
      >
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalContent}>
            {/* Header */}
            <View style={styles.feedbackModalHeader}>
              <Text style={styles.feedbackModalTitle}>Send Feedback</Text>
              <TouchableOpacity
                onPress={() => {
                  setFeedbackModalVisible(false);
                  setSelectedSubscriptionForFeedback(null);
                  setFeedbackRating(5);
                  setFeedbackReview('');
                }}
                style={styles.feedbackCloseBtn}
              >
                <MaterialIcons name="close" size={24} color="#1d1d1f" />
              </TouchableOpacity>
            </View>

            {/* Professional Context Card */}
            {selectedSubscriptionForFeedback && (
              <View style={styles.feedbackProfessionalCard}>
                <View style={styles.feedbackCardHeader}>
                  <View style={[
                    styles.feedbackCardIcon,
                    { 
                      backgroundColor: selectedSubscriptionForFeedback.id === 'gym' 
                        ? 'rgba(33, 150, 243, 0.1)' 
                        : selectedSubscriptionForFeedback.id === 'coach'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(255, 152, 0, 0.1)'
                    }
                  ]}>
                    <MaterialIcons
                      name={
                        selectedSubscriptionForFeedback.id === 'gym'
                          ? 'fitness-center'
                          : selectedSubscriptionForFeedback.id === 'coach'
                          ? 'person'
                          : 'restaurant'
                      }
                      size={20}
                      color={
                        selectedSubscriptionForFeedback.id === 'gym'
                          ? '#2196F3'
                          : selectedSubscriptionForFeedback.id === 'coach'
                          ? '#4CAF50'
                          : '#FF9800'
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedbackCardType}>{selectedSubscriptionForFeedback.typeLabel}</Text>
                    <Text style={styles.feedbackCardPackage}>{selectedSubscriptionForFeedback.packageName || 'Premium Package'}</Text>
                  </View>
                </View>
                <View style={styles.feedbackCardDetails}>
                  <View style={styles.feedbackDetailItem}>
                    <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                    <Text style={styles.feedbackDetailText}>Active Subscription</Text>
                  </View>
                  <View style={styles.feedbackDetailItem}>
                    <MaterialIcons name="calendar-today" size={14} color="#FF6B35" />
                    <Text style={styles.feedbackDetailText}>
                      Renews {selectedSubscriptionForFeedback.validUpto ? new Date(selectedSubscriptionForFeedback.validUpto).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'soon'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Rating Selector */}
            <View style={styles.feedbackRatingSection}>
              <Text style={styles.feedbackRatingLabel}>Your Rating</Text>
              <View style={styles.feedbackStarContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFeedbackRating(star)}
                    style={styles.feedbackStarBtn}
                  >
                    <MaterialIcons
                      name={star <= feedbackRating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= feedbackRating ? '#FFB800' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.feedbackRatingValue}>{feedbackRating}.0 Stars</Text>
            </View>

            {/* Review Text Input */}
            <View style={styles.feedbackReviewSection}>
              <Text style={styles.feedbackReviewLabel}>Your Review</Text>
              <TextInput
                style={styles.feedbackReviewInput}
                placeholder="Share your experience with this service..."
                placeholderTextColor="#999"
                value={feedbackReview}
                onChangeText={setFeedbackReview}
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
                editable={!feedbackSubmitting}
              />
              <Text style={styles.feedbackCharCount}>
                {feedbackReview.length}/500
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.feedbackButtonGroup}>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.feedbackCancelBtn]}
                onPress={() => {
                  setFeedbackModalVisible(false);
                  setSelectedSubscriptionForFeedback(null);
                  setFeedbackRating(5);
                  setFeedbackReview('');
                }}
                disabled={feedbackSubmitting}
              >
                <Text style={styles.feedbackCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton, styles.feedbackSubmitBtn]}
                onPress={handleSubmitFeedback}
                disabled={feedbackSubmitting}
              >
                <Text style={styles.feedbackSubmitBtnText}>
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FooterNav />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 80 },
  profileHeaderWrap: { padding: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative', width: 100, height: 100, marginRight: 20 },
  avatarImg: { width: 100, height: 100, borderRadius: 50, aspectRatio: 1 },
  profileName: { fontWeight: '700', fontSize: 22, color: '#1d1d1f' },
  profileSubtitle: { fontSize: 14, color: '#6e6e73' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  statIconWrap: { marginBottom: 8 },
  statValue: { fontWeight: '700', fontSize: 20 },
  statUnit: { fontSize: 12, color: '#6e6e73' },
  statMeta: { fontSize: 11, color: '#8e8e93', marginTop: 4, textAlign: 'center' },
  statLabel: { fontSize: 13, color: '#6e6e73' },
  sectionWrap: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700', fontSize: 18, color: '#1d1d1f' },
  searchProfessionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3c20',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  searchProfessionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  searchProfessionalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,60,32,0.1)',
  },
  addWorkoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff3c20',
  },
  sectionSubtitle: { fontSize: 14, fontWeight: '600', color: '#ff3c20' },
  postCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  // Responsive, aspect-ratio locked, cover fit for rich media
  postImage: { width: '100%', aspectRatio: 1, borderRadius: 0 }, // 1:1 square, can adjust to 4/5 or 16/9 if needed
    // Placeholder image for fallback (add this image to assets/images/placeholder.png)
  postContent: { padding: 12 },
  postCaption: { fontWeight: '600', fontSize: 15, color: '#1d1d1f', marginBottom: 4 },
  postWorkout: { fontSize: 13, color: '#ff3c20', fontWeight: '700', marginBottom: 4 },
  postStatsRow: { flexDirection: 'row', marginTop: 8 },
  
  // Daily Metrics styles
  metricCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12 
  },
  metricLeft: { flex: 1, marginRight: 16 },
  metricLabel: { fontSize: 15, fontWeight: '600', color: '#1d1d1f', marginBottom: 4 },
  progressBar: { 
    width: '100%', 
    height: 4, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 2, 
    overflow: 'hidden',
    marginTop: 4 
  },
  progressFill: { height: '100%', backgroundColor: '#ff3c20', borderRadius: 2 },
  metricRight: { alignItems: 'flex-end' },
  metricValue: { fontSize: 17, fontWeight: '700', color: '#1d1d1f' },
  metricTarget: { fontSize: 12, color: '#6e6e73', marginTop: 2 },
  metricCompleted: { fontSize: 12, color: '#34c759', marginTop: 2 },
  
  // Schedule styles
  scheduleCard: {
    backgroundColor: '#fff',
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
  scheduleSlot: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scheduleTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff3c20',
    letterSpacing: -0.2,
  },
  scheduleActivity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  scheduleNotes: {
    fontSize: 14,
    color: '#6e6e73',
    lineHeight: 20,
  },
  scheduleMore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3c20',
    textAlign: 'center',
    marginTop: 12,
  },
  
  // Subscription Collapsible List styles
  subscriptionListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    overflow: 'hidden',
  },
  subscriptionListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  subscriptionListItem_last: {
    borderBottomWidth: 0,
  },
  subscriptionListItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  subscriptionListItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionExpandIcon: {
    width: 24,
    height: 24,
  },
  subscriptionListItemLabels: {
    flex: 1,
  },
  subscriptionListItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  subscriptionListItemStatus: {
    fontSize: 12,
    color: '#6e6e73',
    fontWeight: '500',
  },
  subscriptionListItemExpanded: {
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  subscriptionDetailsContainer: {
    marginBottom: 16,
  },
  subscriptionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subscriptionDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6e6e73',
    flex: 1,
  },
  subscriptionDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'right',
    flex: 1,
  },
  subscriptionExpandButton: {
    backgroundColor: '#ff3c20',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  subscriptionExpandButtonModify: {
    backgroundColor: '#34c759',
  },
  subscriptionSearchButton: {
    backgroundColor: '#ff3c20',
    flexDirection: 'row',
  },
  subscriptionExpandButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Diet styles
  dietGrid: { gap: 12 },
  dietCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 12,
    alignItems: 'center' 
  },
  dietMealTitle: { fontSize: 18, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  dietMealText: { fontSize: 14, color: '#6e6e73', textAlign: 'center' },
  
  // Image upload overlay styles
  imageEditOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#ff3c20',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 }),
  },
  videoBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  uploadingOverlayCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3c20',
  },
  postImageContainer: {
    position: 'relative',
    width: '100%',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 320,
    elevation: 4,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1d1d1f',
  },
  modalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    width: '100%',
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSave: {
    backgroundColor: '#ff3c20',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  modalButtonTextSave: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  modalRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  modalCloseBtn: {
    marginTop: 20,
    backgroundColor: '#ff3c20',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Bottom sheet styles
  bottomSheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: 220,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  sheetClose: {
    fontSize: 22,
    color: '#6e6e73',
    fontWeight: '700',
    padding: 4,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sheetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  sheetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  sheetComment: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  commentLikeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  commentLikeText: {
    color: '#ff3c20',
    fontWeight: '700',
    fontSize: 15,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1d1d1f',
    marginRight: 8,
  },
  commentSendBtn: {
    backgroundColor: '#ff3c20',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  commentSendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  replyList: {
    marginTop: 6,
    marginLeft: 36,
    borderLeftWidth: 2,
    borderLeftColor: '#eee',
    paddingLeft: 8,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAvatar: {
    width: 22,
    height: 22,
    fontSize: 13,
    color: '#444',
  },
  replyName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1d1d1f',
    marginRight: 4,
  },
  replyText: {
    fontSize: 13,
    color: '#1d1d1f',
    flexShrink: 1,
  },
  replyBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
  },
  replyBtnText: {
    color: '#ff3c20',
    fontWeight: '600',
    fontSize: 13,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  replyInput: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1d1d1f',
    marginRight: 6,
  },
  replySendBtn: {
    backgroundColor: '#ff3c20',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  replySendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // New subscription styles - hero cards
  activeSubscriptionsContainer: {
    marginBottom: 24,
  },
  subscriptionHeroCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  subscriptionHeroGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  subscriptionHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  subscriptionHeroTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  subscriptionHeroPackage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subscriptionHeroBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionHeroRenewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subscriptionHeroRenewDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  subscriptionHeroButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  // Apple Liquid Glass Capsule Button Style
  subscriptionCapsuleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(20px)',
    elevation: 3,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  subscriptionCapsuleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  subscriptionHeroModifyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  subscriptionHeroModifyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Available services section
  availableServicesContainer: {
    marginBottom: 32,
  },
  availableServicesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6e6e73',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  availableServicesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f5f5f7',
  },
  serviceCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 60, 32, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  serviceCardDescription: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 12,
    lineHeight: 16,
  },
  serviceCardButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ff3c20',
    borderRadius: 6,
    alignItems: 'center',
  },
  serviceCardButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Feedback Modal Styles
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  feedbackModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  feedbackModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  feedbackCloseBtn: {
    padding: 8,
  },
  feedbackProfessionalCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  feedbackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  feedbackCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCardType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  feedbackCardPackage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
  },
  feedbackCardDetails: {
    flexDirection: 'column',
    gap: 8,
  },
  feedbackDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  feedbackSubscriptionInfo: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  feedbackSubscriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 6,
  },
  feedbackSubscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackSubscriptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  feedbackRatingSection: {
    marginBottom: 24,
  },
  feedbackRatingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  feedbackStarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  feedbackStarBtn: {
    padding: 4,
  },
  feedbackRatingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
    textAlign: 'center',
  },
  feedbackReviewSection: {
    marginBottom: 24,
  },
  feedbackReviewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  feedbackReviewInput: {
    borderWidth: 1,
    borderColor: '#d5d5d7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    marginBottom: 6,
    height: 120,
  },
  feedbackCharCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93',
    textAlign: 'right',
  },
  feedbackButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCancelBtn: {
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  feedbackCancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  feedbackSubmitBtn: {
    backgroundColor: '#FF6B35',
  },
  feedbackSubmitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

});
export default IndividualUserHome;
