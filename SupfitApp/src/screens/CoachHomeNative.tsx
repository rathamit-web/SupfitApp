  // ...existing code...
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FooterNav from '../components/FooterNav';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';

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
const MAX_FILE_SIZE_MB = 10;

function isAllowedImageType(mimeType: string | undefined, fileName?: string): boolean {
  if (mimeType && ALLOWED_MIME_TYPES.has(mimeType)) return true;
  // Fallback: check extension if mimeType is missing (some Android/older pickers)
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg','jpeg','png','webp','heic','avif'].includes(ext || '');
  }
  return false;
}

// Memoized icon components for performance

// Memoized icon components for performance
const UserPlusIcon = React.memo(() => <MaterialIcons name="person-add" size={24} color="#ff3c20" />);
UserPlusIcon.displayName = 'UserPlusIcon';
const ClockIcon = React.memo(() => <MaterialIcons name="access-time" size={24} color="#ff3c20" />);
ClockIcon.displayName = 'ClockIcon';
const StarIcon = React.memo(() => <MaterialIcons name="star" size={24} color="#ff3c20" />);
StarIcon.displayName = 'StarIcon';

// Memoized icon components for performance
// (Removed duplicate icon declarations)

const DEFAULT_WORKOUT_IMAGE = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80';

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

// Helper functions for web file input validation
function updateWorkoutImage(workoutId: number, imageData: string, setWorkouts: React.Dispatch<React.SetStateAction<any[]>>, setUploading: (v: number | null) => void) {
  setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, image: imageData } : w));
  setUploading(null);
}

function handleWorkoutFileInput(
  e: Event & { target: HTMLInputElement | null },
  workoutId: number,
  setWorkouts: React.Dispatch<React.SetStateAction<any[]>>,
  setUploading: (v: number | null) => void
) {
  const file = e.target?.files?.[0];
  if (!file) {
    setUploading(null);
    return;
  }
  if (!isAllowedImageType(file.type ?? undefined, file.name)) {
    alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) are allowed.');
    setUploading(null);
    return;
  }
  // No file size restriction: allow large uploads, backend will optimize
  const reader = new FileReader();
  reader.onload = () => {
    updateWorkoutImage(workoutId, reader.result as string, setWorkouts, setUploading);
  };
  reader.onerror = () => {
    alert('Failed to read file. Please try again.');
    setUploading(null);
  };
  reader.readAsDataURL(file);
}
// ...existing code...



function CoachHomeScreen({ navigation }: CoachHomeScreenProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coachName, setCoachName] = useState('Coach');
  const [coachTitle, setCoachTitle] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [sendMessageModal, setSendMessageModal] = useState<{ clientId: number; clientName: string } | null>(null);
  const [messageText, setMessageText] = useState('');
  // Likes/Comments modal state
  const [showLikesModal, setShowLikesModal] = useState<number | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  // Workouts state for editable posts
  const [workouts, setWorkouts] = useState(fallbackWorkouts);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [activeClients, setActiveClients] = useState<{ id: number; name: string; avatar: string; isNew: boolean }[]>([]);
  const [stats, setStats] = useState([
    { label: 'Active Clients', value: '0', icon: UserPlusIcon },
    { label: 'Years Experience', value: '—', unit: 'yrs', icon: ClockIcon },
    { label: 'Rating', value: '4.9', unit: '★', icon: StarIcon },
  ]);

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

  // Load saved data (prefer localStorage userProfile if present)
  useEffect(() => {
    (async () => {
      // Try to get userProfile from localStorage (web only)
      let userProfileName: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const userProfileRaw = window.localStorage.getItem('userProfile');
          if (userProfileRaw) {
            const userProfile = JSON.parse(userProfileRaw);
            if (userProfile && typeof userProfile.name === 'string' && userProfile.name.trim()) {
              userProfileName = userProfile.name.trim();
              setCoachName(userProfileName);
            }
          }
        } catch (e) {
          // ignore
        }
      }
      // Fallback to AsyncStorage if not found
      if (!userProfileName) {
        const savedImage = await AsyncStorage.getItem('coachProfileImage');
        const savedName = await AsyncStorage.getItem('coachName');
        const savedTitle = await AsyncStorage.getItem('coachTitle');
        if (savedImage) setProfileImage(savedImage);
        if (savedName) setCoachName(savedName);
        if (savedTitle) setCoachTitle(savedTitle);
      }
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      // removed loadingData
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) {
        // removed loadingData
        return;
      }

      const userId = authData.user.id;

      const { data: profile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (isMounted && profile) {
        if (profile.full_name) setCoachName(profile.full_name);
        if (profile.preferences && typeof profile.preferences === 'object' && (profile.preferences as Record<string, any>).title) {
          setCoachTitle((profile.preferences as Record<string, any>).title as string);
        }
      }

      const { data: coach } = await supabase
        .from('coaches')
        .select('id, years_experience, rating, average_rating, total_reviews')
        .eq('user_id', userId)
        .maybeSingle();

      let assignmentRows: { client_user_id: string; expires_at: string | null }[] = [];
      if (coach?.id) {
        const { data: assignments } = await supabase
          .from('coach_client_assignments')
          .select('client_user_id, expires_at')
          .eq('coach_id', coach.id);
        assignmentRows = assignments ?? [];
      }

      if (assignmentRows.length && isMounted) {
        const clientIds = assignmentRows.map((a) => a.client_user_id);
        const { data: clientProfiles } = await supabase
          .from('user_profile')
          .select('user_id, full_name')
          .in('user_id', clientIds);
        const clientMap = new Map<string, string | null>(
          (clientProfiles ?? []).map((c) => [c.user_id as string, c.full_name]),
        );
        const mapped = assignmentRows.map((row, idx) => ({
          id: idx + 1,
          name: clientMap.get(row.client_user_id) || 'Client',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
          isNew: !row.expires_at,
        }));
        setActiveClients(mapped);
      } else if (isMounted) {
        setActiveClients([]);
      }

      const { data: programs } = await supabase
        .from('workout_programs')
        .select('id, program_name, plan_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4);

      if (isMounted && programs) {
        const mapped = programs.map((p, idx) => ({
          id: idx + 1,
          image: DEFAULT_WORKOUT_IMAGE,
          likes: 0,
          comments: 0,
          caption: p.plan_type === 'coach_assigned' ? 'Coach-assigned program' : 'AI-generated program',
          workout: p.program_name,
        }));
        setWorkouts(mapped.length ? mapped : fallbackWorkouts);
      }

      if (isMounted) {
        // Fetch years_experience and rating from coaches table
        const yearsExp = coach?.years_experience ?? 0;
        // Use average_rating if available (from reviews), otherwise use rating (coach-set), fallback to 4.5
        const displayRating = coach?.average_rating ?? coach?.rating ?? 4.5;
        
        setStats([
          { label: 'Active Clients', value: String(assignmentRows.length), icon: UserPlusIcon },
          { label: 'Years Experience', value: yearsExp > 0 ? String(yearsExp) : '—', unit: yearsExp > 0 ? 'yrs' : undefined, icon: ClockIcon },
          { label: 'Rating', value: String(displayRating), unit: '★', icon: StarIcon },
        ]);
        // removed loadingData
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const publicUrl = await uploadImageToSupabase(uri, 'profile-images');
        if (publicUrl) {
          setProfileImage(publicUrl);
          // Store only the URL, not base64 data
          await AsyncStorage.setItem('coachProfileImage', publicUrl);
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
        const publicUrl = await uploadImageToSupabase(dataUri, 'profile-images');
        
        if (publicUrl) {
          setProfileImage(publicUrl);
          // Store only the URL, not base64 data
          await AsyncStorage.setItem('coachProfileImage', publicUrl);
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

  /**
   * Handles workout image upload with validation and error handling
   * Matches Meta/Apple/Google best practices for file uploads
   */
  const handleEditWorkoutImage = async (workoutId: number) => {
    setIsUploading(workoutId);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/*,video/mp4,video/quicktime,video/webm,video/*';
        input.onchange = (e: Event) => handleWorkoutFileInput(e as Event & { target: HTMLInputElement | null }, workoutId, setWorkouts, setIsUploading);
        input.click();
        return;
      }
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo access permission is required.');
        setIsUploading(null);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'all' as any, // Use 'all' for both images and videos (deprecated enum value workaround)
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
      });
      if (result.canceled) {
        setIsUploading(null);
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        alert('No image selected.');
        setIsUploading(null);
        return;
      }
      const mimeType: string | undefined = typeof asset.mimeType === 'string' ? asset.mimeType : undefined;
      const fileName: string | undefined = typeof asset.fileName === 'string' ? asset.fileName : undefined;
      if (!isAllowedImageType(mimeType, fileName)) {
        alert('Only images (JPEG, PNG, WEBP, HEIC, AVIF) are allowed.');
        setIsUploading(null);
        return;
      }
      // No file size restriction: allow large uploads, backend will optimize
      setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, image: asset.uri } : w));
      setIsUploading(null);

      // TODO: Upload to Supabase Storage (images/videos bucket) and store public URL
      //       Backend (Edge Function or Storage Function) should optimize:
      //         - Images: compress and resize to max width 1080px (maintain aspect ratio)
      //         - Videos: transcode to max 1080x1920px (vertical), compress for web/mobile
      //       Serve only optimized versions to users for best performance
      //       See DOCS.md for backend implementation details
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      setIsUploading(null);
    }
  };

  const handleSaveProfile = async () => {
    setCoachName(editName);
    setCoachTitle(editTitle);
    await AsyncStorage.setItem('coachName', editName);
    await AsyncStorage.setItem('coachTitle', editTitle);
    setEditModalVisible(false);
  };

  const handleClientClick = (clientId: number) => {
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
            {/* Profile Image */}
            <TouchableOpacity onPress={handleProfileImageChange} style={styles.avatarContainer}>
              <Image
                source={profileImage ? { uri: profileImage } : undefined}
                style={styles.avatar}
                resizeMode="cover"
                fadeDuration={0}
                accessibilityLabel="Coach profile picture"
              />
              <View style={styles.editOverlay}>
                <MaterialIcons name="edit" size={18} color="#ff3c20" />
              </View>
            </TouchableOpacity>

            {/* Name and Title */}
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Show the user-provided name beside the profile picture */}
                <Text style={styles.profileName}>{coachName}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditName(coachName);
                    setEditTitle(coachTitle);
                    setEditModalVisible(true);
                  }}
                  style={styles.editButton}
                >
                  <MaterialIcons name="edit" size={18} color="#ff3c20" />
                </TouchableOpacity>
              </View>
              <Text style={styles.profileTitle}>{coachTitle}</Text>
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
            <Text style={styles.sectionTitle}>Recent Training</Text>
            <View style={{ width: '100%' }}>
              {workouts.map((post) => (
                <View key={post.id} style={[styles.postCard, { width: '100%', marginRight: 0, marginBottom: 16 }]}> 
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleEditWorkoutImage(post.id)}
                    disabled={isUploading === post.id}
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
                      />
                      <View style={styles.imageEditOverlay}>
                        <MaterialIcons name="edit" size={18} color="#ff3c20" />
                      </View>
                      {isUploading === post.id && (
                        <View style={styles.uploadingOverlay}>
                          <Text style={styles.uploadingText}>Uploading...</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.postContent}>
                    <Text style={styles.postWorkout}>{post.workout}</Text>
                    <Text style={styles.postCaption}>{post.caption}</Text>
                    <View style={styles.postStats}>
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
            {showCommentsModal && postComments[showCommentsModal]?.length === 0 && (
              <Text style={{ color: '#6e6e73', fontSize: 15, textAlign: 'center', marginBottom: 12 }}>No comments yet.</Text>
            )}
            {showCommentsModal && postComments[showCommentsModal]?.map((comment) => (
              <View key={comment.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Image source={{ uri: comment.avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1d1d1f' }}>{comment.name}</Text>
                  <Text style={{ fontSize: 14, color: '#444', marginTop: 2 }}>{comment.message}</Text>
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
                onPress={() => {
                  // Add comment logic here
                  setCommentInput('');
                }}
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
            <Text style={styles.sectionTitle}>Active Clients ({activeClients.length})</Text>
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

      <FooterNav mode="coach" navigation={navigation} currentRoute="CoachHome" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 16,
    letterSpacing: -0.3,
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
});

export default CoachHomeScreen;
