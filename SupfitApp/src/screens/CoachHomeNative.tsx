  // ...existing code...
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
// import { Video, ResizeMode } from 'expo-video'; // Not available - use Image with video badge instead
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import FooterNav from '../components/FooterNav';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../api/apiClient';

interface CoachHomeScreenProps {
  readonly navigation: {
    navigate: (screen: string, params?: Record<string, any>) => void;
  };
}

// ...existing code...

// (Removed CoachHomeNative duplicate, only CoachHomeScreen is exported below)


// Globally accepted image types (Meta/Google/Apple standard)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/avif',
]);
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const MAX_FILE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;

const DEFAULT_WORKOUT_IMAGE = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80';
// Private bucket for training media. Signed URLs are generated via Edge Function.
const WORKOUT_BUCKET = 'user-uploads';

function isAllowedImageType(mimeType: string | undefined, fileName?: string): boolean {
  if (mimeType && ALLOWED_MIME_TYPES.has(mimeType)) return true;
  // Fallback: check extension if mimeType is missing (some Android/older pickers)
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

type SignedUrlCacheEntry = { url: string; expiresAt: number };
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();

async function getSignedUrlForPath(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const { data, error } = await supabase.functions.invoke('get-signed-url', {
      body: { bucket: WORKOUT_BUCKET, path },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    if (error) {
      console.error('Signed URL error:', error);
      const { data: fallback, error: fallbackError } = await supabase.storage
        .from(WORKOUT_BUCKET)
        .createSignedUrl(path, 300);
      if (fallbackError) {
        console.error('Signed URL fallback error:', fallbackError);
        return null;
      }
      if (fallback?.signedUrl) {
        signedUrlCache.set(path, { url: fallback.signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
      }
      return fallback?.signedUrl ?? null;
    }
    const signedUrl =
      (typeof data?.signedUrl === 'string' && data.signedUrl) ||
      (typeof data?.signed_url === 'string' && data.signed_url) ||
      (typeof data?.url === 'string' && data.url);
    if (signedUrl && (signedUrl.startsWith('http://') || signedUrl.startsWith('https://'))) {
      signedUrlCache.set(path, { url: signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
      return signedUrl;
    }
    const { data: fallback, error: fallbackError } = await supabase.storage
      .from(WORKOUT_BUCKET)
      .createSignedUrl(path, 300);
    if (fallbackError) {
      console.error('Signed URL fallback error:', fallbackError);
      return null;
    }
    if (fallback?.signedUrl) {
      signedUrlCache.set(path, { url: fallback.signedUrl, expiresAt: Date.now() + 4.5 * 60 * 1000 });
    }
    return fallback?.signedUrl ?? null;
    return null;
  } catch (err) {
    console.error('Failed to fetch signed URL:', err);
    return null;
  }
}


// Memoized icon components for performance
const UserPlusIcon = React.memo(() => <MaterialIcons name="person-add" size={24} color="#ff3c20" />);
UserPlusIcon.displayName = 'UserPlusIcon';
const ClockIcon = React.memo(() => <MaterialIcons name="access-time" size={24} color="#ff3c20" />);
ClockIcon.displayName = 'ClockIcon';
const StarIcon = React.memo(() => <MaterialIcons name="star" size={24} color="#ff3c20" />);
StarIcon.displayName = 'StarIcon';
const SubscriptionIcon = React.memo(() => <MaterialIcons name="credit-card" size={24} color="#ff3c20" />);
SubscriptionIcon.displayName = 'SubscriptionIcon';


/**
 * Upload image to Supabase Storage and return public URL
 * Prevents localStorage quota errors by storing images in cloud storage
 */
async function uploadImageToSupabase(uri: string, folder: string = 'profile-images'): Promise<string | null> {
  try {
    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Supabase auth.getUser() error:', authError);
      alert('Supabase auth error: ' + JSON.stringify(authError));
      return null;
    }
    if (!authData?.user?.id) {
      console.error('No authenticated user');
      alert('No authenticated user. Please log in again.');
      return null;
    }

    const userId = authData.user.id;
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.jpg`;
    const filePath = `${folder}/${fileName}`;

    // Convert URI to blob for upload
    let blob: Blob;
    try {
      const response = await fetch(uri);
      blob = await response.blob();
    } catch (blobError) {
      console.error('Failed to fetch or convert URI to blob:', blobError, uri);
      alert('Failed to process image file. ' + (blobError instanceof Error ? blobError.message : String(blobError)));
      return null;
    }

    // Upload to Supabase Storage
    // Use 'User Uploads' bucket for workout/training images/videos
    const bucket = folder === 'profile-images' ? 'Avatars' : 'User Uploads';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError, { filePath, userId, uri });
      alert('Supabase upload error: ' + JSON.stringify(uploadError));
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    if (!publicUrlData?.publicUrl) {
      console.error('No public URL returned from Supabase:', publicUrlData);
      alert('No public URL returned from Supabase.');
      return null;
    }
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    alert('Unexpected error uploading to Supabase: ' + (error instanceof Error ? error.message : String(error)));
    return null;
  }
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80';

const fallbackWorkouts = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
    likes: 234,
    comments: 12,
    caption: 'Morning cardio session with clients 💪',
    workout: 'Training',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
    likes: 189,
    comments: 8,
    caption: 'Group strength training today 🔥',
    workout: 'Strength',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    likes: 312,
    comments: 15,
    caption: 'Client transformation results! 💯',
    workout: 'Results',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    likes: 276,
    comments: 19,
    caption: 'Yoga & flexibility session 🧘',
    workout: 'Yoga',
  },
];

function CoachHomeScreen({ navigation }: CoachHomeScreenProps) {
    // Helper: Validate image URL (Supabase or local)
    function getValidImageSource(url: string | null | undefined, fallback: any) {
      if (!url) return fallback;
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) return { uri: url };
      // Only support static require for known local assets
      // Dynamic require is not supported in React Native/Expo
      // If you want to support local assets, pass the require result directly as the fallback
      return fallback;
    }
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageLoading, setProfileImageLoading] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);
  // Fetch from DB only; do not show a hardcoded fallback name.
  const [coachName, setCoachName] = useState<string | null>(null);
  const [coachTitle, setCoachTitle] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [addTrainingModalVisible, setAddTrainingModalVisible] = useState(false);
  const [newWorkoutText, setNewWorkoutText] = useState('');
  const [newCaptionText, setNewCaptionText] = useState('');
  const [sendMessageModal, setSendMessageModal] = useState<{ clientId: number; clientName: string } | null>(null);
  const [messageText, setMessageText] = useState('');
  // Likes/Comments modal state
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Record<number, Array<{ id: number; user: string; message: string; created_at: string }>>>({});
    // Fetch comments for a workout slot when modal opens
    useEffect(() => {
      const fetchComments = async () => {
        if (!showCommentsModal) return;
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user?.id) return;
        const userId = authData.user.id;
        const { data, error } = await supabase
          .from('workout_comments')
          .select('id, user_id, message, created_at')
          .eq('user_id', userId)
          .eq('slot_id', showCommentsModal)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setComments((prev) => ({ ...prev, [showCommentsModal]: data.map((c) => ({
            id: c.id,
            user: c.user_id,
            message: c.message,
            created_at: c.created_at,
          })) }));
        }
      };
      fetchComments();
    }, [showCommentsModal]);
  // Workouts state for editable posts
  const [workouts, setWorkouts] = useState(fallbackWorkouts);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<any[] | null>(null);

  const persistWorkoutCounts = async (slotId: number, nextLikes: number, nextComments: number) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      console.error('Supabase auth error (persistWorkoutCounts):', authError);
      alert('Not signed in: ' + (authError?.message || 'Please sign in again.'));
      throw new Error('User not authenticated.');
    }
    const userId = authData.user.id;

    // Ensure row exists (idempotent) and persist counts.
    const { error } = await supabase
      .from('user_workouts')
      .upsert(
        {
          user_id: userId,
          slot_id: slotId,
          likes: nextLikes,
          comments: nextComments,
        },
        { onConflict: 'user_id,slot_id' },
      );
    if (error) {
      console.error('Supabase error (persistWorkoutCounts):', error);
      alert('Failed to update workout counts: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  const handleLikeWorkout = async (slotId: number) => {
    const previousState = userWorkouts;
    const current = previousState?.find((w) => w.id === slotId);
    const base = current ?? fallbackWorkouts.find((w) => w.id === slotId);
    if (!base) return;

    const nextLikes = (base.likes ?? 0) + 1;
    const nextComments = base.comments ?? 0;
    const optimistic = (previousState ?? []).some((w) => w.id === slotId)
      ? (previousState ?? []).map((w) => (w.id === slotId ? { ...w, likes: nextLikes } : w))
      : [...(previousState ?? []), { ...base, likes: nextLikes }];
    setUserWorkouts(optimistic);

    try {
      await persistWorkoutCounts(slotId, nextLikes, nextComments);
    } catch (err) {
      console.error('Failed to persist like:', err);
      setUserWorkouts(previousState);
      alert('Failed to like workout. Please try again.');
    }
  };

  const handleAddComment = async () => {
    const slotId = showCommentsModal;
    if (!slotId) return;
    const text = commentInput.trim();
    if (!text) return;
    setCommentInput('');
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) throw new Error('User not authenticated.');
      const userId = authData.user.id;
      // Insert comment into workout_comments table
      const { data: inserted, error: insertError } = await supabase
        .from('workout_comments')
        .insert({ user_id: userId, slot_id: slotId, message: text })
        .select('id, user_id, message, created_at')
        .maybeSingle();
      if (insertError) throw insertError;
      // Optimistically update comments state
      if (inserted) {
        setComments((prev) => ({
          ...prev,
          [slotId]: [...(prev[slotId] || []), {
            id: inserted.id,
            user: inserted.user_id,
            message: inserted.message,
            created_at: inserted.created_at,
          }],
        }));
      }
      // Also increment comment count in user_workouts
      const previousState = userWorkouts;
      const current = previousState?.find((w) => w.id === slotId);
      const base = current ?? fallbackWorkouts.find((w) => w.id === slotId);
      if (!base) return;
      const nextLikes = base.likes ?? 0;
      const nextComments = (base.comments ?? 0) + 1;
      const optimistic = (previousState ?? []).some((w) => w.id === slotId)
        ? (previousState ?? []).map((w) => (w.id === slotId ? { ...w, comments: nextComments } : w))
        : [...(previousState ?? []), { ...base, comments: nextComments }];
      setUserWorkouts(optimistic);
      await persistWorkoutCounts(slotId, nextLikes, nextComments);
    } catch (err) {
      alert('Failed to add comment. Please try again.');
    }
  };

    useEffect(() => {
      let isMounted = true;
      const fetchUserWorkouts = async () => {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user?.id) {
          console.error('Supabase auth error (fetchUserWorkouts):', authError);
          alert('Not signed in: ' + (authError?.message || 'Please sign in again.'));
          return;
        }
        const userId = authData.user.id;
        const { data, error } = await supabase
          .from('user_workouts')
          .select('id, slot_id, image_url, caption, workout, likes, comments')
          .eq('user_id', userId)
          .order('slot_id', { ascending: true });
        if (error) {
          console.error('Supabase error (fetchUserWorkouts):', error);
          alert('Failed to fetch workouts: ' + (error.message || 'Unknown error'));
          if (isMounted) setUserWorkouts([]);
          return;
        }
        if (data && data.length > 0) {
          const enriched = await Promise.all(
            data.map(async (item) => {
              const canonicalPath = extractWorkoutStoragePath(item.image_url ?? null);
              const signedUrl = canonicalPath ? await getSignedUrlForPath(canonicalPath) : null;
              return {
                ...item,
                // Map DB rows into the fixed UI slot IDs (1..4)
                id: (item as any).slot_id ?? item.id,
                dbId: item.id,
                image_path: canonicalPath,
                image_url: signedUrl ?? null,
                storagePath: canonicalPath,
              };
            }),
          );
          if (isMounted) setUserWorkouts(enriched);
        } else {
          if (isMounted) setUserWorkouts([]);
        }
      };
      fetchUserWorkouts();
      return () => {
        isMounted = false;
      };
    }, []);
  type ActiveClientInfo = {
    id: string;
    name: string;
    avatar: string;
    isNew: boolean;
    hasActiveSubscription: boolean;
  };
  type CoachRecord = {
    id: string;
    years_experience?: number | null;
    rating?: number | null;
    average_rating?: number | null;
    total_reviews?: number | null;
  };

  const [activeClients, setActiveClients] = useState<ActiveClientInfo[]>([]);
  const [activeClientCount, setActiveClientCount] = useState(0);
  const [activeSubscriptionCount, setActiveSubscriptionCount] = useState(0);
  const [stats, setStats] = useState([
    { label: 'Active Clients', value: '0', icon: UserPlusIcon },
    { label: 'Active Subscriptions', value: '0', icon: SubscriptionIcon },
    { label: 'Years Experience', value: '—', unit: 'yrs', icon: ClockIcon },
    { label: 'Rating', value: '4.9', unit: '★', icon: StarIcon },
  ]);

  const updateStatValue = useCallback((label: string, value: string) => {
    setStats((prev) =>
      prev.map((stat) => (stat.label === label ? { ...stat, value } : stat)),
    );
  }, []);

  const [coachRecord, setCoachRecord] = useState<CoachRecord | null>(null);
  const [clientListLoading, setClientListLoading] = useState(false);
  const [clientListError, setClientListError] = useState<string | null>(null);
  const [clientFetchCycle, setClientFetchCycle] = useState(0);
  const clientRetryAttemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CLIENT_BACKOFF_BASE_MS = 1500;
  const CLIENT_MAX_RETRIES = 4;

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleClientRetry = () => {
    if (clientRetryAttemptRef.current >= CLIENT_MAX_RETRIES) {
      setToastMessage('Unable to refresh active clients automatically. Tap Retry.');
      return;
    }
    const delay = Math.min(30000, CLIENT_BACKOFF_BASE_MS * 2 ** clientRetryAttemptRef.current);
    clearRetryTimer();
    clientRetryAttemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      setClientFetchCycle((prev) => prev + 1);
    }, delay);
  };

  const handleManualRetry = () => {
    if (clientListLoading) return;
    clearRetryTimer();
    clientRetryAttemptRef.current = 0;
    setClientListError(null);
    setClientFetchCycle((prev) => prev + 1);
  };

  useEffect(() => {
    if (!toastMessage) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3200);
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [toastMessage]);

  const postLikes: Record<number, { id: number; name: string; avatar: string }[]> = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
    ],
  };
  const postComments: Record<number, { id: number; name: string; avatar: string; message: string }[]> = {
    1: [
      { id: 1, name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Amazing session! 🔥' },
      { id: 2, name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', message: 'Great energy!' },
    ],
    2: [
      { id: 1, name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', message: 'Loved the workout.' },
    ],
    3: [
      { id: 1, name: 'John Smith', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', message: 'Super inspiring!' },
    ],
    4: [
      { id: 1, name: 'Rachel Green', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', message: 'Yoga vibes!' },
    ],
  };

  // Load DB-backed coach profile. Non-critical queries are best-effort.
  useEffect(() => {
    let isMounted = true;
    const fetchCoachData = async () => {
      if (isMounted) {
        setIsProfileLoading(true);
        setProfileLoadError(null);
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        if (isMounted) {
          setProfileLoadError('Not signed in');
          setCoachName(null);
          setCoachTitle(null);
          setIsProfileLoading(false);
        }
        return;
      }
      const userId = authData.user.id;

      // Fetch user profile (name, title/bio, and avatar)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, bio, avatar_url')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileError) {
          console.error('Failed to load user profile:', profileError);
        } else if (profileData) {
          if (isMounted) {
            setCoachName(profileData.full_name && profileData.full_name.trim() ? profileData.full_name.trim() : null);
            setCoachTitle(profileData.bio && profileData.bio.trim() ? profileData.bio.trim() : null);
            
            // Set profile image if avatar_url exists
            if (profileData.avatar_url && typeof profileData.avatar_url === 'string') {
              setProfileImage(profileData.avatar_url);
              setProfileImageError(false);
              setProfileImageLoading(true); // Start loading, will be reset onLoadEnd
              console.log('[CoachHome] Avatar loaded:', profileData.avatar_url.substring(0, 50) + '...');
            } else {
              console.log('[CoachHome] No avatar_url found in profile');
              setProfileImage(null);
              setProfileImageLoading(false);
            }
          }
        }
      } catch (profileFetchError) {
        console.error('Error fetching user profile:', profileFetchError);
      }

      let fetchedCoach: CoachRecord | null = null;
      try {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('id, years_experience, rating, average_rating, total_reviews')
          .eq('user_id', userId)
          .maybeSingle();
        fetchedCoach = coachData ?? null;
      } catch (coachError) {
        console.error('Failed to load coach metadata:', coachError);
      }
      if (isMounted) {
        setCoachRecord(fetchedCoach);
      }

      const yearsExperienceString = typeof fetchedCoach?.years_experience === 'number'
        ? String(fetchedCoach.years_experience)
        : '—';
      const ratingValue = typeof fetchedCoach?.rating === 'number'
        ? fetchedCoach.rating
        : typeof fetchedCoach?.average_rating === 'number'
          ? fetchedCoach.average_rating
          : null;
      const ratingDisplay = ratingValue !== null ? ratingValue.toFixed(1) : '—';
      if (isMounted) {
        updateStatValue('Years Experience', yearsExperienceString);
        updateStatValue('Rating', ratingDisplay);
        setIsProfileLoading(false);
      }
    };
    fetchCoachData();
    return () => {
      isMounted = false;
    };
  }, [updateStatValue]);

  useEffect(() => {
    if (!coachRecord?.id) return;
    let isMounted = true;
    const fetchClientSummary = async () => {
      setClientListLoading(true);
      setClientListError(null);
      try {
        const { data: clientRows, error: clientError, count } = await supabase
          .from('coach_clients')
          .select('client_id, created_at', { count: 'exact' })
          .eq('coach_id', coachRecord.id)
          .eq('status', 'active')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(8);
        if (clientError) throw clientError;
        const clientCountValue = typeof count === 'number' ? count : (clientRows?.length ?? 0);
        const clientIds = Array.isArray(clientRows)
          ? clientRows.map((row) => row.client_id).filter((id): id is string => Boolean(id))
          : [];

        let profileData: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
        if (clientIds.length) {
          const { data: profileRows } = await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url')
            .in('id', clientIds);
          profileData = profileRows ?? [];
        }

        const avatarMap = new Map(profileData.map((profile) => [profile.id, profile.avatar_url]));
        const nameMap = new Map(profileData.map((profile) => [profile.id, profile.full_name]));

        let subscriptionClientIds = new Set<string>();
        if (clientIds.length) {
          const { data: subscriptionRows, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('client_id')
            .eq('coach_id', coachRecord.id)
            .eq('status', 'active')
            .eq('is_deleted', false)
            .in('client_id', clientIds);
          if (subscriptionError) {
            console.error('Failed to load client subscription flags:', subscriptionError);
          } else {
            subscriptionClientIds = new Set((subscriptionRows ?? []).map((row) => row.client_id));
          }
        }

        let subscriptionCountValue: number | null = null;
        try {
          const { count: subscriptionCount } = await supabase
            .from('subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('coach_id', coachRecord.id)
            .eq('status', 'active')
            .eq('is_deleted', false);
          subscriptionCountValue = Number(subscriptionCount ?? 0);
        } catch (subscriptionCountError) {
          console.error('Failed to fetch subscription count:', subscriptionCountError);
        }

        const newClients = (clientRows ?? []).map((row) => {
          const createdAt = row.created_at ? Date.parse(row.created_at) : NaN;
          const isNew = Number.isNaN(createdAt) ? true : Date.now() - createdAt <= 14 * 24 * 60 * 60 * 1000;
          return {
            id: row.client_id,
            name: nameMap.get(row.client_id) || 'Client',
            avatar:
              avatarMap.get(row.client_id) ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            isNew,
            hasActiveSubscription: subscriptionClientIds.has(row.client_id),
          };
        });

        if (isMounted) {
          setActiveClients(newClients);
          setActiveClientCount(clientCountValue);
          if (subscriptionCountValue !== null) {
            setActiveSubscriptionCount(subscriptionCountValue);
          }
          updateStatValue('Active Clients', String(clientCountValue));
          if (subscriptionCountValue !== null) {
            updateStatValue('Active Subscriptions', String(subscriptionCountValue));
          }
          setClientListError(null);
          clientRetryAttemptRef.current = 0;
          clearRetryTimer();
        }
      } catch (clientError) {
        console.error('Failed to refresh active clients:', clientError);
        if (isMounted) {
          setClientListError('Unable to load active clients. Tap Retry.');
          setToastMessage('Active clients list failed. Retrying shortly.');
        }
        scheduleClientRetry();
      } finally {
        if (isMounted) {
          setClientListLoading(false);
        }
      }
    };
    fetchClientSummary();
    return () => {
      isMounted = false;
      clearRetryTimer();
    };
  }, [coachRecord?.id, clientFetchCycle, updateStatValue]);
  const todaySchedule = [
    {
      id: 1,
      name: 'Jane Doe',
      time: '10:00 AM',
      location: 'City Gym',
      type: 'in-person',
      status: 'attend',
    },
    {
      id: 2,
      name: 'Mike Ross',
      time: '11:30 AM',
      location: 'Online',
      type: 'online',
      status: 'absent',
    },
    {
      id: 3,
      name: 'Sarah Chen',
      time: '2:00 PM',
      location: 'Online',
      type: 'online',
      status: 'attend',
    },
  ];

  const payments = [
    {
      id: 1,
      name: 'Alex Chen',
      amount: '₹150.00',
      status: 'pending',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
    {
      id: 2,
      name: 'Sarah Lee',
      amount: '₹200.00',
      status: 'overdue',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      id: 3,
      name: 'David Kim',
      amount: '₹150.00',
      status: 'received',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    },
  ];

  const messages = [
    {
      id: 1,
      name: 'Emily Carter',
      message: 'Great, see you tomorrow at 10!',
      time: '10m ago',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    },
    {
      id: 2,
      name: 'Liam Johnson',
      message: "I'll have to reschedule my session this...",
      time: '1h ago',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    },
    {
      id: 3,
      name: 'Sophia Brown',
      message: 'Thanks for the diet plan update!',
      time: '2h ago',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
  ];

  /**
   * Handles profile image upload with validation and error handling
   * Matches Meta/Apple/Google best practices for file uploads
   */
  const handleProfileImageChange = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/*';
        input.onchange = (e: Event) => handleProfileFileInput(e as Event & { target: HTMLInputElement | null });
        input.click();
        return;
      }
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo access permission is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduced quality to compress image
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mimeType: string | undefined = typeof asset.mimeType === 'string' ? asset.mimeType : undefined;
        const fileName: string | undefined = typeof asset.fileName === 'string' ? asset.fileName : undefined;
        if (!isAllowedImageType(mimeType, fileName)) {
          alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) are allowed.');
          return;
        }
        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
          const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
          alert(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
          return;
        }
        // Upload to Supabase Storage to avoid localStorage quota
        const uri = asset.uri;
        const uploadedUrl = await uploadImageToSupabase(uri, 'profile-images');
        if (uploadedUrl) {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError || !authData?.user?.id) {
            alert('Not signed in.');
            return;
          }
          const cacheBustedUrl = `${uploadedUrl}?v=${Date.now()}`;
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url: cacheBustedUrl })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Failed to update avatar_url:', updateError);
            alert('Uploaded image, but failed to save to profile.');
            return;
          }
          setProfileImage(cacheBustedUrl);
          setProfileImageError(false);
          setProfileImageLoading(true);
          console.log('[CoachHome] Avatar updated:', cacheBustedUrl.substring(0, 50) + '...');
        } else {
          alert('Failed to upload image. Please try again. (See console for details)');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to upload image. Please try again. (See console for details)');
    }
  };

  async function handleProfileFileInput(e: Event & { target: HTMLInputElement | null }) {
    const file = e.target?.files?.[0];
    if (!file) {
      return;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    
    try {
      // Create a temporary data URL for upload
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result as string;
        
        // Upload to Supabase Storage to avoid localStorage quota
        const uploadedUrl = await uploadImageToSupabase(dataUri, 'profile-images');
        
        if (uploadedUrl) {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError || !authData?.user?.id) {
            alert('Not signed in.');
            return;
          }
          const cacheBustedUrl = `${uploadedUrl}?v=${Date.now()}`;
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url: cacheBustedUrl })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Failed to update avatar_url:', updateError);
            alert('Uploaded image, but failed to save to profile.');
            return;
          }
          setProfileImage(cacheBustedUrl);
          setProfileImageError(false);
          setProfileImageLoading(true);
          console.log('[CoachHome] Avatar updated:', cacheBustedUrl.substring(0, 50) + '...');
        } else {
          alert('Failed to upload image. Please try again.');
        }
      };
      reader.onerror = () => {
        alert('Failed to read file. Please try again.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload image. Please try again.');
    }
  }

  const getNextWorkoutSlotId = () => {
    const source = userWorkouts && userWorkouts.length > 0 ? userWorkouts : workouts;
    const ids = source.map((item: any) => (typeof item.id === 'number' ? item.id : Number(item.id) || 0));
    const maxId = ids.length ? Math.max(...ids) : 0;
    return maxId + 1;
  };

  /**
   * Handles training image/video upload with validation and privacy
   * Stores canonical object paths in DB and uses private buckets + signed URLs
   */
  const handleEditWorkoutImage = async (
    workoutId: number,
    overrides?: { workout?: string; caption?: string },
  ) => {
    setIsUploading(workoutId);
    const previousState = userWorkouts;
    const previousRecord = previousState?.find((record) => record.id === workoutId);
    const previousStoragePath = previousRecord?.image_path
      ?? previousRecord?.storagePath
      ?? extractWorkoutStoragePath(previousRecord?.image_url ?? previousRecord?.image ?? null);
    const fetchAndSetUserWorkouts = async (userId: string) => {
      // Fetch latest workouts from Supabase and update state
      const { data, error } = await supabase
        .from('user_workouts')
        .select('id, slot_id, workout, caption, image_url, likes, comments')
        .eq('user_id', userId)
        .order('slot_id', { ascending: true });
      if (!error && data) {
        const enriched = await Promise.all(
          data.map(async (item: any) => {
            const canonicalPath = extractWorkoutStoragePath(item.image_url ?? null);
            const signedUrl = canonicalPath ? await getSignedUrlForPath(canonicalPath) : null;
            return {
              id: item.slot_id ?? item.id,
              dbId: item.id,
              workout: item.workout,
              caption: item.caption,
              likes: item.likes,
              comments: item.comments,
              image_path: canonicalPath,
              image_url: signedUrl ?? null,
              storagePath: canonicalPath,
            };
          }),
        );
        setUserWorkouts(enriched);
      }
    };
    try {
      if (Platform.OS === 'web') {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user?.id) {
          throw new Error('User not authenticated.');
        }
        const userId = authData.user.id;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/avif,video/mp4,video/webm,video/quicktime';
        input.onchange = async () => {
          try {
            const file = input.files?.[0];
            if (!file) return;
            const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
            if (!isVideo && !ALLOWED_MIME_TYPES.has(file.type)) {
              alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) or videos (MP4, WebM, MOV) are allowed.');
              return;
            }
            const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB;
            if (file.size > maxSize * 1024 * 1024) {
              const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
              alert(`File too large (${sizeMB}MB). Maximum size is ${maxSize}MB.`);
              return;
            }

            const fallbackRecord = fallbackWorkouts.find((item) => item.id === workoutId);
            const baseRecord = previousRecord ?? fallbackRecord ?? {
              id: workoutId,
              likes: 0,
              comments: 0,
              caption: '',
              workout: 'Workout',
            };
            const nextWorkout = overrides?.workout?.trim() || baseRecord.workout;
            const nextCaption = overrides?.caption?.trim() || baseRecord.caption;

            // Ensure a DB row exists for this slot (idempotent).
            const { error: seedError } = await supabase
              .from('user_workouts')
              .upsert(
                {
                  user_id: userId,
                  slot_id: workoutId,
                  workout: nextWorkout,
                  caption: nextCaption,
                  likes: baseRecord.likes ?? 0,
                  comments: baseRecord.comments ?? 0,
                },
                { onConflict: 'user_id,slot_id' },
              );
            if (seedError) throw seedError;

            const ext = file.name.split('.').pop()?.toLowerCase() || (isVideo ? 'mp4' : 'jpg');
            const filePath = `${userId}/${workoutId}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from(WORKOUT_BUCKET)
              .upload(filePath, file, { contentType: file.type || 'application/octet-stream', upsert: true });
            if (uploadError) throw uploadError;

            // Persist canonical object path (not public URL)
            const { data: savedRows, error: updateError } = await supabase
              .from('user_workouts')
              .update({
                image_url: filePath,
              })
              .eq('user_id', userId)
              .eq('slot_id', workoutId)
              .select('id, slot_id, workout, caption, image_url, likes, comments')
              .limit(1);
            if (updateError) throw updateError;

            if (savedRows && savedRows[0]) {
              // After upload/update, always re-fetch workouts to ensure UI is up to date
              await fetchAndSetUserWorkouts(userId);
            }

            if (previousStoragePath && previousStoragePath !== filePath) {
              const { error: deleteError } = await supabase.storage.from(WORKOUT_BUCKET).remove([previousStoragePath]);
              if (deleteError) console.warn('Failed to delete previous training image', deleteError);
            }
          } catch (err) {
            console.error('Training image upload failed (web):', err);
            alert('Training image upload failed: ' + (err instanceof Error ? err.message : String(err)));
            setUserWorkouts(previousState);
          } finally {
            setIsUploading(null);
          }
        };
        input.click();
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) throw new Error('User not authenticated.');
      const userId = authData.user.id;

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo access permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.95,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        alert('No image selected.');
        return;
      }

      const mimeType = typeof asset.mimeType === 'string' ? asset.mimeType : undefined;
      const fileName = typeof asset.fileName === 'string' ? asset.fileName : undefined;
      const isVideo = asset.type === 'video' || (mimeType ? ALLOWED_VIDEO_TYPES.has(mimeType) : false);

      if (!isVideo && !isAllowedImageType(mimeType, fileName)) {
        alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) or videos (MP4, WebM, MOV) are allowed.');
        return;
      }
      if (isVideo && mimeType && !ALLOWED_VIDEO_TYPES.has(mimeType)) {
        alert('Only videos (MP4, WebM, MOV) are allowed.');
        return;
      }
      if (asset.fileSize) {
        const maxSize = isVideo ? MAX_VIDEO_SIZE_MB : MAX_FILE_SIZE_MB;
        if (asset.fileSize > maxSize * 1024 * 1024) {
          const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
          alert(`File too large (${sizeMB}MB). Maximum size is ${maxSize}MB.`);
          return;
        }
      }

      let uploadBlob: Blob;
      let filePath: string;
      if (isVideo) {
        const ext = fileName?.split('.').pop()?.toLowerCase() || 'mp4';
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

      // Ensure a DB row exists for this slot (idempotent).
      const fallbackRecord = fallbackWorkouts.find((item) => item.id === workoutId);
      const baseRecord = previousRecord ?? fallbackRecord ?? {
        id: workoutId,
        likes: 0,
        comments: 0,
        caption: '',
        workout: 'Workout',
      };
      const nextWorkout = overrides?.workout?.trim() || baseRecord.workout;
      const nextCaption = overrides?.caption?.trim() || baseRecord.caption;
      const { error: seedError } = await supabase
        .from('user_workouts')
        .upsert(
          {
            user_id: userId,
            slot_id: workoutId,
            workout: nextWorkout,
            caption: nextCaption,
            likes: baseRecord.likes ?? 0,
            comments: baseRecord.comments ?? 0,
          },
          { onConflict: 'user_id,slot_id' },
        );
      if (seedError) throw seedError;

      const { error: uploadError } = await supabase.storage
        .from(WORKOUT_BUCKET)
        .upload(filePath, uploadBlob, { contentType: mimeType || 'application/octet-stream', upsert: true });
      if (uploadError) throw uploadError;

      // Persist canonical object path (not public URL)
      const { error: updateError } = await supabase
        .from('user_workouts')
        .update({
          image_url: filePath,
        })
        .eq('user_id', userId)
        .eq('slot_id', workoutId);
      if (updateError) throw updateError;

      // After upload/update, always re-fetch workouts to ensure UI is up to date
      await fetchAndSetUserWorkouts(userId);

      if (previousStoragePath && previousStoragePath !== filePath) {
        const { error: deleteError } = await supabase.storage
          .from(WORKOUT_BUCKET)
          .remove([previousStoragePath]);
        if (deleteError) console.warn('Failed to delete previous training image', deleteError);
      }
    } catch (error) {
      console.error('Training image upload failed:', error);
      let msg = 'Training image upload failed.';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          msg += ' ' + error.message;
        } else if ('error_description' in error && typeof error.error_description === 'string') {
          msg += ' ' + error.error_description;
        } else {
          try {
            msg += ' ' + JSON.stringify(error);
          } catch {}
        }
      } else if (typeof error === 'string') {
        msg += ' ' + error;
      }
      alert(msg);
    } finally {
      setIsUploading(null);
    }
  };

  const handleSaveProfile = async () => {
    const nextName = editName.trim();
    const nextTitle = editTitle.trim();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      alert('Not signed in.');
      return;
    }
    const userId = authData.user.id;

    const { data: updated, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: nextName,
        bio: nextTitle,
      })
      .eq('id', userId)
      .select('full_name, bio')
      .maybeSingle();

    if (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to save. Please try again.');
      return;
    }

    // Reflect the DB response only.
    const savedName = typeof updated?.full_name === 'string' ? updated.full_name.trim() : '';
    setCoachName(savedName.length ? savedName : null);
    const savedTitle = typeof updated?.bio === 'string' ? updated.bio.trim() : '';
    setCoachTitle(savedTitle.length ? savedTitle : null);
    setEditModalVisible(false);
  };

  const handleClientClick = (clientId: string) => {
    navigation.navigate('ClientDetail', { clientId });
  };

  const handleSendMessage = async () => {
    if (!sendMessageModal || !messageText.trim()) return;
    
    // Save message to localStorage for the client to see
    const allMessages = JSON.parse(await AsyncStorage.getItem('userMessages') || '[]');
    allMessages.push({
      clientId: sendMessageModal.clientId,
      message: messageText.trim(),
      from: 'coach',
      date: new Date().toISOString(),
    });
    await AsyncStorage.setItem('userMessages', JSON.stringify(allMessages));
    
    setMessageText('');
    setSendMessageModal(null);
    alert('Message sent successfully!');
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <MaterialIcons name="schedule" size={18} color="#ff9800" />;
      case 'overdue':
        return <MaterialIcons name="error" size={18} color="#f44336" />;
      case 'received':
        return <MaterialIcons name="check-circle" size={18} color="#4caf50" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Section */}
        <LinearGradient
          colors={['rgba(255,60,32,0.08)', 'rgba(255,87,34,0.04)', 'rgba(255,255,255,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            {/* Profile Image with Loading State */}
            <TouchableOpacity onPress={handleProfileImageChange} style={styles.avatarContainer}>
              {/* Skeleton Loader */}
              {profileImageLoading && profileImage && !profileImageError && (
                <View style={[styles.avatar, styles.skeletonAvatar]} />
              )}
              
              {/* Actual Image */}
              {profileImage && !profileImageError ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatar}
                  resizeMode="cover"
                  fadeDuration={300}
                  onLoadEnd={() => {
                    setProfileImageLoading(false);
                    console.log('[CoachHome] Profile image loaded successfully');
                  }}
                  onError={(error) => {
                    console.error('[CoachHome] Failed to load profile image:', error);
                    setProfileImageError(true);
                    setProfileImageLoading(false);
                  }}
                  accessibilityLabel="Coach profile picture"
                />
              ) : (
                /* Fallback Avatar (Default or Error) */
                <Image
                  source={{ uri: DEFAULT_AVATAR }}
                  style={styles.avatar}
                  resizeMode="cover"
                  fadeDuration={300}
                  onLoadEnd={() => setProfileImageLoading(false)}
                  accessible
                  accessibilityLabel="Default coach avatar"
                />
              )}
              
              {/* Edit Overlay */}
              <View style={styles.editOverlay}>
                <MaterialIcons name="edit" size={18} color="#ff3c20" />
              </View>
            </TouchableOpacity>

            {/* Name and Title */}
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Show the user-provided name beside the profile picture */}
                {isProfileLoading ? (
                  <View style={styles.skeletonLoader}>
                    <View style={[styles.skeletonLoader, { width: 150, height: 28 }]} />
                  </View>
                ) : (
                  <Text style={styles.profileName}>
                    {coachName || 'Unnamed Coach'}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setEditName(coachName || '');
                    setEditTitle(coachTitle || '');
                    setEditModalVisible(true);
                  }}
                  style={styles.editButton}
                >
                  <MaterialIcons name="edit" size={18} color="#ff3c20" />
                </TouchableOpacity>
              </View>
              {isProfileLoading ? (
                <View style={[styles.skeletonLoader, { marginTop: 8 }]}>
                  <View style={[styles.skeletonLoader, { width: 200, height: 16 }]} />
                </View>
              ) : (
                <Text style={styles.profileTitle}>{coachTitle || ''}</Text>
              )}
              {!!profileLoadError && !isProfileLoading && (
                <Text style={[styles.profileTitle, { color: '#d32f2f' }]}>{profileLoadError}</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <View key={stat.label} style={styles.statCard}>
                  <View style={styles.statIconWrap}>
                    <Icon />
                  </View>
                  <Text style={styles.statValue}>
                    {stat.value}
                    {stat.unit && <Text style={styles.statUnit}> {stat.unit}</Text>}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Workout Posts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Training</Text>
              <TouchableOpacity
                onPress={() => setAddTrainingModalVisible(true)}
                style={styles.addTrainingButton}
                accessibilityLabel="Add training post"
                accessibilityHint="Double tap to add a new training post"
              >
                <MaterialIcons name="add-circle" size={22} color="#ff3c20" />
                <Text style={styles.addTrainingButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={{ width: '100%' }}>
              {(userWorkouts && userWorkouts.length > 0 ? userWorkouts : workouts).length === 0 ? (
                <Text style={{ color: '#6e6e73', fontSize: 15, textAlign: 'center', marginVertical: 24 }}>No workouts found.</Text>
              ) : (
                (userWorkouts && userWorkouts.length > 0 ? userWorkouts : workouts).map((post) => {
                  const mediaPath = post.image_path ?? extractWorkoutStoragePath(post.image_url ?? post.image ?? null);
                  const mediaType = getMediaTypeFromPath(mediaPath ?? post.image_url ?? post.image ?? null);
                  const mediaUrl = typeof post.image_url === 'string' ? post.image_url : (typeof post.image === 'string' ? post.image : null);
                  return (
                    <View key={post.id} style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}> 
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        onPress={() => handleEditWorkoutImage(post.id)}
                        disabled={isUploading === post.id}
                        accessibilityLabel={`Edit ${post.workout} workout image`}
                        accessibilityHint="Double tap to select a new image or video for this workout"
                      >
                        <View style={styles.postImageContainer}>
                          <Image
                            source={getValidImageSource(
                              mediaUrl || post.image,
                              require('../../assets/images/react-logo.png'),
                            )}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                          {mediaType === 'video' && mediaUrl && (
                            <View style={styles.videoBadge}>
                              <MaterialIcons name="play-arrow" size={24} color="#fff" />
                            </View>
                          )}
                          {isUploading === post.id && (
                            <View style={styles.uploadingOverlay}>
                              <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    <View style={styles.postContent}>
                      <Text style={styles.postWorkout}>{post.workout}</Text>
                      <Text style={styles.postCaption}>{post.caption || post.caption}</Text>
                      <View style={styles.postStats}>
                        <TouchableOpacity
                          onPress={async () => {
                            await handleLikeWorkout(post.id);
                            setShowLikesModal(post.id);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                          accessibilityLabel="Show likes"
                          accessibilityHint="Double tap to view who liked this workout"
                          accessibilityRole="button"
                        >
                          <MaterialIcons name="favorite" size={18} color="#ff3c20" />
                          <Text style={{ marginLeft: 4, color: '#6e6e73' }}>{post.likes ?? post.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setShowCommentsModal(post.id)}
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                          accessibilityLabel="Show comments"
                          accessibilityHint="Double tap to view comments for this workout"
                          accessibilityRole="button"
                        >
                          <MaterialIcons name="chat-bubble-outline" size={18} color="#6e6e73" />
                          <Text style={{ marginLeft: 4, color: '#6e6e73' }}>{post.comments ?? post.comments}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
      {/* Likes Modal */}
      <Modal
        visible={showLikesModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLikesModal(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* No dimmed overlay, just the bottom sheet */}
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, width: '100%', maxWidth: 500, alignSelf: 'center', zIndex: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 20 }}>Likes</Text>
            {showLikesModal && postLikes[showLikesModal]?.length === 0 && (
              <Text style={{ color: '#6e6e73', fontSize: 15, textAlign: 'center', marginBottom: 12 }}>No likes yet.</Text>
            )}
            {showLikesModal && postLikes[showLikesModal]?.map((like) => (
              <View key={like.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Image source={{ uri: like.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' }} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1d1d1f' }}>{like.name}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowLikesModal(null)} style={{ marginTop: 20, backgroundColor: '#ff3c20', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* No dimmed overlay, just the bottom sheet */}
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, width: '100%', maxWidth: 500, alignSelf: 'center', zIndex: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 20 }}>Comments</Text>
            {showCommentsModal && (!comments[showCommentsModal] || comments[showCommentsModal].length === 0) && (
              <Text style={{ color: '#6e6e73', fontSize: 15, textAlign: 'center', marginBottom: 12 }}>No comments yet.</Text>
            )}
            {showCommentsModal && comments[showCommentsModal]?.map((comment) => (
              <View key={comment.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#ff3c20', fontSize: 16 }}>{comment.user.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1d1d1f' }}>{comment.user}</Text>
                  <Text style={{ fontSize: 14, color: '#444', marginTop: 2 }}>{comment.message}</Text>
                  <Text style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(comment.created_at).toLocaleString()}</Text>
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a comment..."
                style={{ flex: 1, height: 36, borderRadius: 18, backgroundColor: '#f5f5f7', paddingHorizontal: 14, fontSize: 15, color: '#1d1d1f', marginRight: 8 }}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={{ backgroundColor: '#ff3c20', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 18 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowCommentsModal(null)} style={{ marginTop: 20, backgroundColor: '#ff3c20', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

          {/* Active Clients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Clients ({activeClientCount})</Text>
            <Text style={styles.sectionSubtitle}>
              {activeSubscriptionCount} {activeSubscriptionCount === 1 ? 'active subscription' : 'active subscriptions'}
            </Text>
            {clientListLoading && (
              <Text style={styles.clientLoadingText}>Refreshing active clients...</Text>
            )}
            {clientListError && (
              <View style={styles.clientErrorRow}>
                <Text style={styles.clientErrorText}>{clientListError}</Text>
                <TouchableOpacity
                  onPress={handleManualRetry}
                  style={styles.retryButton}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading clients"
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientsScroll}>
              {activeClients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => handleClientClick(client.id)}
                  style={styles.clientCard}
                >
                  <Image
                    source={{ uri: client.avatar }}
                    style={styles.clientAvatar}
                    resizeMode="cover"
                    fadeDuration={0}
                  />
                  {client.isNew && <View style={styles.newBadge} />}
                  <Text style={styles.clientName} numberOfLines={1}>
                    {client.name}
                  </Text>
                  {client.hasActiveSubscription && (
                    <View style={styles.clientSubscriptionBadge}>
                      <Text style={styles.clientSubscriptionText}>Subscription active</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today’s Schedule</Text>
            {todaySchedule.map((session) => (
              <View key={session.id} style={styles.scheduleCard}>
                <View style={styles.scheduleLeft}>
                  <Text style={styles.scheduleName}>{session.name}</Text>
                  <View style={styles.scheduleDetails}>
                    <MaterialIcons name="access-time" size={14} color="#6e6e73" />
                    <Text style={styles.scheduleText}>{session.time}</Text>
                    <MaterialIcons
                      name={session.type === 'online' ? 'videocam' : 'location-on'}
                      size={14}
                      color="#6e6e73"
                      style={{ marginLeft: 12 }}
                    />
                    <Text style={styles.scheduleText}>{session.location}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    session.status === 'attend' ? styles.statusAttend : styles.statusAbsent,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {session.status === 'attend' ? 'Attend' : 'Absent'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Payments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <Image
                  source={{ uri: payment.avatar }}
                  style={styles.paymentAvatar}
                  resizeMode="cover"
                  fadeDuration={0}
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{payment.name}</Text>
                  <Text style={styles.paymentAmount}>{payment.amount}</Text>
                </View>
                <View style={styles.paymentStatus}>{getPaymentStatusIcon(payment.status)}</View>
              </View>
            ))}
          </View>

          {/* Recent Messages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            {messages.map((message) => (
              <View key={message.id} style={styles.messageCard}>
                <Image
                  source={{ uri: message.avatar }}
                  style={styles.messageAvatar}
                  resizeMode="cover"
                  fadeDuration={0}
                />
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageName}>{message.name}</Text>
                    <Text style={styles.messageTime}>{message.time}</Text>
                  </View>
                  <Text style={styles.messageText} numberOfLines={1}>
                    {message.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.modalInput}
              placeholder="Enter your name"
            />
            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              style={styles.modalInput}
              placeholder="Enter your title"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProfile} style={[styles.modalButton, styles.modalButtonSave]}>
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Message Modal */}
      <Modal visible={sendMessageModal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message to {sendMessageModal?.clientName}</Text>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Type your message..."
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setSendMessageModal(null);
                  setMessageText('');
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendMessage} style={[styles.modalButton, styles.modalButtonSave]}>
                <Text style={styles.modalButtonTextSave}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Training Modal */}
      <Modal visible={addTrainingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Training</Text>
            <Text style={styles.modalLabel}>Workout</Text>
            <TextInput
              value={newWorkoutText}
              onChangeText={setNewWorkoutText}
              style={styles.modalInput}
              placeholder="e.g., Strength, Cardio"
            />
            <Text style={styles.modalLabel}>Caption</Text>
            <TextInput
              value={newCaptionText}
              onChangeText={setNewCaptionText}
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Write a caption..."
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setAddTrainingModalVisible(false);
                  setNewWorkoutText('');
                  setNewCaptionText('');
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const nextId = getNextWorkoutSlotId();
                  await handleEditWorkoutImage(nextId, {
                    workout: newWorkoutText || 'Workout',
                    caption: newCaptionText,
                  });
                  setAddTrainingModalVisible(false);
                  setNewWorkoutText('');
                  setNewCaptionText('');
                }}
                style={[styles.modalButton, styles.modalButtonSave]}
              >
                <Text style={styles.modalButtonTextSave}>Choose Media</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {toastMessage && (
        <View style={[styles.toastContainer, { pointerEvents: 'none' }]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <FooterNav mode="coach" navigation={navigation} currentRoute="CoachHome" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#fff',
  },
  skeletonAvatar: {
    backgroundColor: '#e5e5ea',
    position: 'absolute',
  },
  editOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  imageEditOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 6,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
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
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.5,
  },
  profileTitle: {
    fontSize: 15,
    color: '#6e6e73',
    marginTop: 4,
  },
  editButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
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
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,60,32,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6e6e73',
  },
  statLabel: {
    fontSize: 12,
    color: '#6e6e73',
    textAlign: 'center',
    marginTop: 2,
  },
  mainContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 12,
  },
  addTrainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,60,32,0.1)',
  },
  addTrainingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff3c20',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
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
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  postImageContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  postContent: {
    padding: 16,
  },
  postWorkout: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff3c20',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postCaption: {
    fontSize: 15,
    color: '#1d1d1f',
    marginBottom: 12,
    lineHeight: 22,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postStatText: {
    fontSize: 15,
    color: '#6e6e73',
    fontWeight: '500',
  },
  clientsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  clientCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 16,
  },
  clientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3c20',
    borderWidth: 2,
    borderColor: '#fff',
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 4,
  },
  clientErrorRow: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,60,32,0.25)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clientErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#ff3c20',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#ff3c20',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  clientSubscriptionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
  },
  clientSubscriptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34c759',
    textTransform: 'uppercase',
  },
  messageButton: {
    backgroundColor: 'rgba(255,60,32,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  scheduleLeft: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 6,
  },
  scheduleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 13,
    color: '#6e6e73',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusAttend: {
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  statusAbsent: {
    backgroundColor: 'rgba(244,67,54,0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  paymentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 14,
    color: '#6e6e73',
  },
  paymentStatus: {
    padding: 8,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  messageAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  messageTime: {
    fontSize: 12,
    color: '#6e6e73',
  },
  messageText: {
    fontSize: 14,
    color: '#6e6e73',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  toastText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
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
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  modalButtonSave: {
    backgroundColor: '#ff3c20',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skeletonLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientLoadingText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default CoachHomeScreen;
