// NOTE: For graceful fallback, add a placeholder image at: src/assets/images/placeholder.png
// import placeholderImg from '../assets/images/placeholder.png'; // Disabled: placeholder not present yet
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_KEYS } from '../lib/subscriptionStorage';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import Toast from 'react-native-root-toast';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FooterNav from '../components/FooterNav';
import ErrorBoundary from '../components/ErrorBoundary';
import supabase from '../../shared/supabaseClient';

// Helper for file input error handling (must be at true module scope for linter)

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'video/mp4',
  'video/quicktime',
  'video/webm'
]);
const MAX_FILE_SIZE_MB = 10;

const BoltIcon = React.memo(() => <MaterialIcons name="bolt" size={24} color="#ff3c20" />);
BoltIcon.displayName = 'BoltIcon';
const GroupIcon = React.memo(() => <MaterialIcons name="group" size={24} color="#ff3c20" />);
GroupIcon.displayName = 'GroupIcon';
const TrendingUpIcon = React.memo(() => <MaterialIcons name="trending-up" size={24} color="#ff3c20" />);
TrendingUpIcon.displayName = 'TrendingUpIcon';

/**
 * Upload image to Supabase Storage and return public URL
 * Prevents localStorage quota errors by storing images in cloud storage
 */
async function uploadImageToSupabase(uri: string, folder: string = 'profile-images'): Promise<string | null> {
  try {
    // Get authenticated user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      console.error('No authenticated user');
      return null;
    }

    const userId = authData.user.id;
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.jpg`;
    const filePath = `${folder}/${fileName}`;

    // Convert URI to blob for upload
    let blob: Blob;
    if (Platform.OS === 'web') {
      // For web, convert base64 data URI to blob
      const response = await fetch(uri);
      blob = await response.blob();
    } else {
      // For native, fetch the file
      const response = await fetch(uri);
      blob = await response.blob();
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return null;
  }
}

function IndividualUserHomeScreen({ navigation, route }: any) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState([
    { id: 1, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', likes: 234, comments: 12, caption: 'Morning cardio session 💪 Crushed 10K!', workout: 'Running' },
    { id: 2, image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', likes: 189, comments: 8, caption: 'Leg day hits different 🔥', workout: 'Strength' },
    { id: 3, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', likes: 312, comments: 15, caption: 'New PR on deadlifts! 💯', workout: 'Powerlifting' },
    { id: 4, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', likes: 276, comments: 19, caption: 'Yoga flow to end the week 🧘', workout: 'Yoga' },
  ]);

  // User display name and subtitle (character)
  const [displayName, setDisplayName] = useState('Fitness Titan');
  const [subtitle, setSubtitle] = useState('Athlete • Coach • Runner');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Load user info from DB (supabase)
  useEffect(() => {
    (async () => {
      // Replace with actual user id logic
      const userId = 1;
      const { data } = await supabase
        .from('users')
        .select('name, subtitle')
        .eq('id', userId)
        .single();
      if (data) {
        setDisplayName(data.name || 'Fitness Titan');
        setSubtitle(data.subtitle || 'Athlete • Coach • Runner');
      }
    })();
  }, []);

  // Save user info to DB
  const handleSaveName = async () => {
    setSavingName(true);
    setEditModalVisible(false); // Close modal immediately on save
    // Replace with actual user id logic
    const userId = 1;
    const { error } = await supabase
      .from('users')
      .update({ name: editName, subtitle: editSubtitle })
      .eq('id', userId);
    if (!error) {
      setDisplayName(editName);
      setSubtitle(editSubtitle);
    }
    setSavingName(false);
  };
  const [isUploading, setIsUploading] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  // Removed unused commentingPostId state
  const [replyingTo, setReplyingTo] = useState<{ postId: number, commentId: number } | null>(null);
  const [replyInput, setReplyInput] = useState('');

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
   * Validates image file type and size with comprehensive checks
   * @returns error message string if invalid, null if valid
   */
  // Removed unused validateImage function

  /**
   * Shows error toast with consistent styling for accessibility
   */
  // Removed unused showErrorToast function

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
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png';
        input.onchange = (e: any) => handleProfileFileInput(e, setProfileImage, setIsUploading);
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
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduced quality to compress image
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
      });
      if (result.canceled) {
        setIsUploading(false);
        return;
      }
      const asset = result.assets[0];
      if (asset.mimeType && !ALLOWED_MIME_TYPES.has(asset.mimeType)) {
        alert('Only images (JPEG, PNG) and videos (MP4, MOV, WebM) are allowed.');
        setIsUploading(false);
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
        const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
        alert(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        setIsUploading(false);
        return;
      }
      
      // Upload to Supabase Storage to avoid localStorage quota
      const publicUrl = await uploadImageToSupabase(asset.uri, 'profile-images');
      
      if (publicUrl) {
        setProfileImage(publicUrl);
        showSuccessToast('✓ Profile picture updated');
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper for web file input for profile image
  function handleProfileFileInput(e: any, setImage: (uri: string) => void, setUploading: (v: boolean) => void) {
    const file = e.target?.files?.[0];
    if (!file) return setUploading(false);
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      Toast.show('Only JPEG and PNG images are allowed.', {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER,
        backgroundColor: '#ff3b30',
        textColor: '#fff',
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
          : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
        animation: true,
        hideOnPress: true,
      });
      setUploading(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      Toast.show(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`, {
        duration: Toast.durations.LONG,
        position: Toast.positions.CENTER,
        backgroundColor: '#ff3b30',
        textColor: '#fff',
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
          : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
        animation: true,
        hideOnPress: true,
      });
      setUploading(false);
      return;
    }
    readFileAndSetImage(file, setImage, setUploading, '✓ Profile picture updated');
  }




// Helper for file input error handling (must be at true module scope for linter)

  function readFileAndSetImage(
    file: File,
    setImage: (uri: string) => void,
    setUploading: (v: boolean) => void,
    successMsg: string
  ) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      
      // Upload to Supabase Storage to avoid localStorage quota
      const publicUrl = await uploadImageToSupabase(dataUri, 'profile-images');
      
      if (publicUrl) {
        setImage(publicUrl);
        showSuccessToast(successMsg);
      } else {
        alert('Failed to upload image. Please try again.');
      }
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

// Removed unused readFileAndSetWorkoutImage

  /**
   * Handles workout image upload with validation and error handling
   */
  const handleEditWorkoutImage = async (workoutId: number) => {
    setIsUploading(true);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/*,video/mp4,video/quicktime,video/webm,video/*';
        input.onchange = (e: any) => handleWorkoutFileInput(e, workoutId, setWorkouts, setIsUploading);
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
        mediaTypes: 'images',
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
      if (asset.mimeType && !ALLOWED_MIME_TYPES.has(asset.mimeType)) {
        alert('Only images (JPEG, PNG) and videos (MP4, MOV, WebM) are allowed.');
        setIsUploading(false);
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
        const sizeMB = (asset.fileSize / (1024 * 1024)).toFixed(1);
        alert(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        setIsUploading(false);
        return;
      }
      
      // Upload to Supabase Storage to avoid localStorage quota
      const publicUrl = await uploadImageToSupabase(asset.uri, 'workout-images');
      
      if (publicUrl) {
        setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, image: publicUrl } : w));
        showSuccessToast('✓ Workout image updated');
      } else {
        alert('Failed to upload image. Please try again.');
      }
      setIsUploading(false);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      setIsUploading(false);
    }
  };

  // Helper for web file input for workout image
  async function updateWorkoutImage(workoutId: number, imageData: string, setWorkouts: React.Dispatch<React.SetStateAction<any[]>>, setUploading: (v: boolean) => void) {
    // Upload to Supabase Storage to avoid localStorage quota
    const publicUrl = await uploadImageToSupabase(imageData, 'workout-images');
    
    if (publicUrl) {
      setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, image: publicUrl } : w));
      showSuccessToast('✓ Workout image updated');
    } else {
      alert('Failed to upload image. Please try again.');
    }
    setUploading(false);
  }

  function handleWorkoutFileInput(
    e: any,
    workoutId: number,
    setWorkouts: React.Dispatch<React.SetStateAction<any[]>>,
    setUploading: (v: boolean) => void
  ) {
    const file = e.target?.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      alert('Only images (JPEG, PNG) and videos (MP4, MOV, WebM) are allowed.');
      setUploading(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      alert(`File too large (${sizeMB}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      setUploading(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateWorkoutImage(workoutId, reader.result as string, setWorkouts, setUploading);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  const stats = [
    { label: 'Active Hours', value: '6.5', unit: 'hrs', icon: BoltIcon },
    { label: 'Followers', value: '12.5K', icon: GroupIcon },
    { label: 'Rewards', value: '89', unit: '🏆', icon: TrendingUpIcon },
  ];

  const dailyMetrics = [
    { label: 'Steps', value: '8,500', target: '10,000', progress: 85 },
    { label: 'Gym', value: '1 hr', completed: true },
    { label: 'Badminton', value: '1 hr', completed: true },
    { label: 'Swim', value: '45 min', completed: true },
    { label: 'Calories', value: '520 kcal' },
    { label: 'Avg HR', value: '78 bpm' },
    { label: 'Sleep', value: '7h 20m' },
  ];

  // Weekly Schedule state
  const [todaySchedule, setTodaySchedule] = useState<any>(null);
  
  // Load schedule on mount
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const clientId = 1; // Replace with actual user id
        const stored = await AsyncStorage.getItem(`schedule_${clientId}`);
        if (stored) {
          const schedule = JSON.parse(stored);
          if (schedule?.recommendedDay && schedule?.schedules) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const todayData = schedule.schedules.find((s: any) => s.day === today);
            if (todayData) {
              setTodaySchedule(todayData);
            }
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };
    loadSchedule();
    const unsubscribe = navigation.addListener?.('focus', loadSchedule);
    return unsubscribe;
  }, [navigation]);

  // Subscription state: load from correct keys
  const [subscriptions, setSubscriptions] = useState([
    { type: 'My Gym', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
    { type: 'Gym Coach', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
    { type: 'Dietician', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
  ]);

  // Load each subscription type from AsyncStorage on mount/focus
  useEffect(() => {
    const loadSubs = async () => {
      try {
        const [gym, coach, dietician] = await Promise.all([
          AsyncStorage.getItem(SUBSCRIPTION_KEYS.gym),
          AsyncStorage.getItem(SUBSCRIPTION_KEYS.coach),
          AsyncStorage.getItem(SUBSCRIPTION_KEYS.dietician),
        ]);
        setSubscriptions([
          gym ? { type: 'My Gym', ...JSON.parse(gym) } : { type: 'My Gym', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
          coach ? { type: 'Gym Coach', ...JSON.parse(coach) } : { type: 'Gym Coach', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
          dietician ? { type: 'Dietician', ...JSON.parse(dietician) } : { type: 'Dietician', name: 'Not Selected', status: 'unpaid', amount: '₹0', validTill: null, packageName: null },
        ]);
      } catch {}
    };
    loadSubs();
    // Optionally reload on navigation focus
    const unsubscribe = navigation.addListener?.('focus', loadSubs);
    return unsubscribe;
  }, [navigation, route?.params]);

  const dietPlan = {
    breakfast: 'Oatmeal with berries and almonds',
    lunch: 'Grilled chicken with quinoa and vegetables',
    dinner: 'Lean beef with sweet potato and asparagus',
  };

  // Fetch likes for a workout post
  const fetchLikes = async (postId: number) => {
    setLoadingLikes(true);
    const { data, error } = await supabase
      .from('workout_likes')
      .select('id, user:users (name, avatar)')
      .eq('workout_id', postId);
    setLoadingLikes(false);
    if (error) return;
    setLikesData(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.user?.name || 'User',
        avatar: row.user?.avatar || '',
      }))
    );
  };

  // Fetch comments for a workout post
  const fetchComments = async (postId: number) => {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('workout_comments')
      .select('id, user:users (name, avatar), message, likes')
      .eq('workout_id', postId)
      .order('created_at', { ascending: true });
    setLoadingComments(false);
    if (error) return;
    setCommentsData(
      (data || []).map((row: any) => ({
        id: row.id,
        name: row.user?.name || 'User',
        avatar: row.user?.avatar || '',
        message: row.message,
        likes: row.likes || 0,
      }))
    );
  };

  // Fetch replies for a comment
  const fetchReplies = async (commentId: number) => {
    const { data, error } = await supabase
      .from('workout_comment_replies')
      .select('id, user:users (name, avatar), message')
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true });
    if (error) return;
    setRepliesData(prev => ({
      ...prev,
      [commentId]: (data || []).map((row: any) => ({
        id: row.id,
        name: row.user?.name || 'User',
        avatar: row.user?.avatar || '',
        message: row.message,
      })),
    }));
  };

  // Add a like
  // Removed unused addLike function

  // Add a comment
  const addComment = async (postId: number, userId: number, message: string) => {
    await supabase.from('workout_comments').insert({ workout_id: postId, user_id: userId, message });
    fetchComments(postId);
  };

  // Add a reply
  const addReply = async (commentId: number, userId: number, message: string) => {
    await supabase.from('workout_comment_replies').insert({ comment_id: commentId, user_id: userId, message });
    fetchReplies(commentId);
  };

  // Like a comment
  const likeComment = async (commentId: number, userId: number) => {
    await supabase.rpc('like_comment', { comment_id: commentId, user_id: userId });
    fetchComments(showCommentsModal!);
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

  return (
    <ErrorBoundary>
      <LinearGradient
      colors={["#f8f9fa", "#f5f5f7"]}
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
                // onError fallback not needed, handled by source
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
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </View>
          <View style={{ width: '100%' }}>
            {workouts.map((post) => (
              <View key={post.id} style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => handleEditWorkoutImage(post.id)}
                  disabled={isUploading}
                  accessibilityLabel={`Edit ${post.workout} workout image`}
                  accessibilityHint="Double tap to select a new image for this workout"
                >
                  <View style={styles.postImageContainer}>
                    <Image
                      source={post.image ? { uri: post.image } : undefined}
                      style={styles.postImage}
                      resizeMode="cover"
                      fadeDuration={0}
                      accessibilityLabel={`${post.workout} workout image`}
                      accessibilityHint="Double tap to change this workout image"
                      // onError fallback not needed, handled by source
                    />
                    <View style={styles.imageEditOverlay}>
                      <MaterialIcons name="edit" size={18} color="#ff3c20" />
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
                      onPress={() => setShowLikesModal(post.id)}
                      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
                      accessibilityLabel="Show likes"
                      accessibilityHint="Double tap to view who liked this workout"
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="favorite" size={18} color="#ff3c20" />
                      <Text style={{ marginLeft: 4, color: '#6e6e73' }}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowCommentsModal(post.id)}
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

        {/* Today's Schedule Section */}
        {todaySchedule && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
              <Text style={styles.sectionSubtitle}>{todaySchedule.day}</Text>
            </View>
            <View style={styles.scheduleCard}>
              {todaySchedule.slots.slice(0, 3).map((slot: any) => (
                <View key={slot.time} style={styles.scheduleSlot}>
                  <View style={styles.scheduleTimeWrap}>
                    <MaterialIcons name="schedule" size={16} color="#ff3c20" />
                    <Text style={styles.scheduleTime}>{slot.time}</Text>
                  </View>
                  <Text style={styles.scheduleActivity}>{slot.activity}</Text>
                  {slot.notes && <Text style={styles.scheduleNotes}>{slot.notes}</Text>}
                </View>
              ))}
              {todaySchedule.slots.length > 3 && (
                <Text style={styles.scheduleMore}>+{todaySchedule.slots.length - 3} more sessions</Text>
              )}
            </View>
          </View>
        )}

        {/* Subscriptions Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>My Subscriptions</Text>
          {subscriptions.map((sub) => (
            <View key={sub.type} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionType}>{sub.type}</Text>
                <TouchableOpacity>
                  <MaterialIcons name="edit" size={20} color="#ff3c20" />
                </TouchableOpacity>
              </View>
              <Text style={styles.subscriptionName}>{sub.name}</Text>
              <Text style={styles.subscriptionAmount}>{sub.amount}</Text>
              {sub.status === 'paid' && sub.validTill && (
                <Text style={{ fontSize: 13, color: '#34c759', fontWeight: '600', marginBottom: 8 }}>
                  Valid till: {new Date(sub.validTill).toLocaleDateString()}
                </Text>
              )}
              {sub.status === 'unpaid' && (
                <TouchableOpacity 
                  style={styles.subscribeButton}
                  onPress={() => {
                    if (sub.type === 'My Gym') navigation.navigate('SelectGymNative');
                    else if (sub.type === 'Gym Coach') navigation.navigate('SelectCoachNative');
                    else if (sub.type === 'Dietician') navigation.navigate('SelectDieticianNative');
                  }}
                  accessibilityLabel={`Subscribe to ${sub.type}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.subscribeButtonText}>Subscribe</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
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
                          addReply(comment.id, 1, replyInput); // Replace 1 with actual userId
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
                <TouchableOpacity style={styles.commentLikeBtn} accessibilityLabel="Like comment" onPress={() => likeComment(comment.id, 1)}>
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
                  addComment(showCommentsModal, 1, commentInput); // Replace 1 with actual userId
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

      <FooterNav />
    </LinearGradient>
    </ErrorBoundary>
  );
}

export default function IndividualUserHome(props: any) {
  return (
    <ErrorBoundary>
      <IndividualUserHomeScreen {...props} />
    </ErrorBoundary>
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
  statLabel: { fontSize: 13, color: '#6e6e73' },
  sectionWrap: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700', fontSize: 18, color: '#1d1d1f' },
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
  
  // Subscription styles
  subscriptionCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16 
  },
  subscriptionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8 
  },
  subscriptionType: { fontSize: 13, color: '#6e6e73', fontWeight: '500' },
  subscriptionName: { fontSize: 18, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  subscriptionAmount: { fontSize: 24, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  subscribeButton: { 
    backgroundColor: '#ff3c20', 
    borderRadius: 10, 
    padding: 12, 
    alignItems: 'center' 
  },
  subscribeButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  
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
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 6,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }),
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
  modalRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  modalText: {
    fontSize: 15,
    color: '#1d1d1f',
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
    borderRadius: 11,
    marginRight: 6,
    backgroundColor: '#eee',
  },
  replyName: {
    fontWeight: '600',
    fontSize: 13,
    color: '#1d1d1f',
    marginRight: 4,
  },
  replyText: {
    fontSize: 13,
    color: '#444',
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
});
