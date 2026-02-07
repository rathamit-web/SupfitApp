import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FooterNav from '../components/FooterNav';
import { supabase } from '../lib/supabaseClient';

interface Package {
  id: string;
  recordId?: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isActive: boolean;
  slug: string;
  isDefaultSeed?: boolean;
}

interface EditingPackage extends Package {
  newFeature: string;
}

interface SupabasePackageRow {
  id: string;
  name: string | null;
  description: string | null;
  price: number | string | null;
  feature_list: unknown;
  status: string | null;
  slug: string | null;
  is_default: boolean | null;
}

const PROFESSIONAL_TYPE: 'coach' = 'coach';

const createLocalId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const slugifyName = (value: string) => {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const fallback = `package-${Date.now().toString(36)}`;
  return base || fallback;
};

const createEmptyPackage = (): Package => ({
  id: createLocalId(),
  name: 'Custom Package',
  price: 999,
  description: 'Describe the outcomes clients can expect.',
  features: [],
  isActive: false,
  slug: slugifyName(`custom-${Date.now()}`),
  isDefaultSeed: false,
});

const SEED_PACKAGES: Package[] = [
  {
    id: 'seed-basic',
    name: 'Basic Package',
    price: 999,
    description: 'Perfect for beginners',
    features: ['Personalized workout plans', 'Weekly check-ins', 'Email support'],
    isActive: true,
    slug: 'basic-package',
    isDefaultSeed: true,
  },
  {
    id: 'seed-premium',
    name: 'Premium Package',
    price: 1999,
    description: 'For serious fitness enthusiasts',
    features: [
      'Personalized workout plans',
      'Weekly check-ins',
      'Video call consultations',
      'Nutrition guidance',
      'Priority support',
    ],
    isActive: false,
    slug: 'premium-package',
    isDefaultSeed: true,
  },
  {
    id: 'seed-elite',
    name: 'Elite Package',
    price: 2999,
    description: 'The ultimate coaching experience',
    features: [
      'All Premium features',
      'Daily personalized coaching',
      'Supplement recommendations',
      '24/7 support',
      'Progress tracking analytics',
    ],
    isActive: false,
    slug: 'elite-package',
    isDefaultSeed: true,
  },
];

const mapRowToPackage = (row: SupabasePackageRow): Package => ({
  id: row.id,
  recordId: row.id,
  name: row.name ?? '',
  price: Number(row.price ?? 0),
  description: row.description ?? '',
  features: Array.isArray(row.feature_list)
    ? row.feature_list.map((feature) => String(feature))
    : [],
  isActive: row.status === 'active',
  slug: row.slug ?? slugifyName(row.name ?? 'coach-package'),
  isDefaultSeed: row.is_default ?? false,
});

const clonePackage = (pkg: Package): Package => ({
  ...pkg,
  features: [...pkg.features],
});

const CoachSubscriptionNative = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [packages, setPackages] = useState<Package[]>(() => SEED_PACKAGES.map((pkg) => clonePackage(pkg)));
  const [editingPackage, setEditingPackage] = useState<EditingPackage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [syncingPackageId, setSyncingPackageId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Animation values for toast notifications
  const successAnimValue = useRef(new Animated.Value(0)).current;
  const errorAnimValue = useRef(new Animated.Value(0)).current;

  const closeModal = () => {
    setShowEditModal(false);
    setEditingPackage(null);
  };

  const handleAddPackage = () => {
    const freshPackage = createEmptyPackage();
    setEditingPackage({ ...freshPackage, newFeature: '' });
    setShowEditModal(true);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapPackages = async () => {
      setLoadingPackages(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const authUserId = authData?.user?.id;
        if (!authUserId) {
          throw new Error('Missing user session. Please sign in again.');
        }

        if (!isMounted) return;
        setUserId(authUserId);
        console.log('[CoachSubscription] Auth user ID:', authUserId);

        // Multi-layer role resolution for robustness
        let resolvedRole: string | null = null;

        // Layer 1: Try DB (public.users)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', authUserId)
          .single();

        if (!userError && userData?.role) {
          resolvedRole = userData.role;
          console.log('[CoachSubscription] Role from DB:', resolvedRole);
        } else {
          console.warn('[CoachSubscription] DB role fetch failed/empty:', userError?.message);
        }

        // Layer 2: Try auth metadata if DB failed
        if (!resolvedRole && authData?.user?.user_metadata?.role) {
          resolvedRole = authData.user.user_metadata.role;
          console.log('[CoachSubscription] Role from auth metadata:', resolvedRole);
        }

        // Layer 3: Try global context as final fallback
        if (!resolvedRole && typeof window !== 'undefined') {
          const globalRole = (window as any).__supfit_selected_role;
          if (globalRole) {
            resolvedRole = globalRole;
            console.log('[CoachSubscription] Role from global context:', resolvedRole);
          }
        }

        if (resolvedRole) {
          setUserRole(resolvedRole);
        } else {
          console.warn('[CoachSubscription] No role found in any layer. User may not have completed role selection.');
        }

        const { data, error } = await supabase
          .from('professional_packages')
          .select('id, name, description, price, feature_list, status, slug, is_default')
          .eq('owner_user_id', authUserId)
          .eq('professional_type', PROFESSIONAL_TYPE)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!isMounted) return;

        if (data && data.length > 0) {
          setPackages(data.map((row) => clonePackage(mapRowToPackage(row))));
        } else {
          setPackages(SEED_PACKAGES.map((pkg) => clonePackage(pkg)));
        }
      } catch (err) {
        console.error('Failed to load packages', err);
        if (isMounted) {
          setPackages(SEED_PACKAGES.map((pkg) => clonePackage(pkg)));
          Alert.alert(
            'Unable to load packages',
            err instanceof Error ? err.message : 'Please try again in a moment.'
          );
        }
      } finally {
        if (isMounted) setLoadingPackages(false);
      }
    };

    bootstrapPackages();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistPackage = async (pkg: Package): Promise<Package | null> => {
    if (!userId) {
      const message = 'Missing session. Please sign in again.';
      Alert.alert('Not signed in', message);
      console.error('[CoachSubscription]', message);
      return null;
    }

    setSyncingPackageId(pkg.id);
    try {
      // Diagnostic: Check user role before attempting persist
      if (!userRole) {
        console.warn('[CoachSubscription] WARNING: User role is null/undefined. Attempting to fetch from storage...');
        
        // Try one more time to fetch role from DB with detailed logging
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', userId)
          .single();

        if (retryError) {
          console.error('[CoachSubscription] Retry DB fetch failed:', retryError);
        }
        if (retryData?.role) {
          console.log('[CoachSubscription] Role found on retry:', retryData.role);
          setUserRole(retryData.role);
        } else {
          console.warn('[CoachSubscription] Expected role: "coach" or "dietician", got:', userRole);
          Alert.alert(
            'Account Setup Issue',
            'Your account role is not configured. Please sign out and sign in again with the correct role selection (Coach & Dietician).',
            [
              { text: 'OK', style: 'cancel' },
              { text: 'Sign Out', onPress: () => supabase.auth.signOut().then(() => console.log('Signed out')) }
            ]
          );
          return null;
        }
      }

      if (userRole && userRole !== PROFESSIONAL_TYPE) {
        console.warn('[CoachSubscription] WARNING: User role mismatch', {
          userRole,
          professionalType: PROFESSIONAL_TYPE,
          willFailRLS: userRole !== PROFESSIONAL_TYPE,
        });
        Alert.alert(
          'Account Type Mismatch',
          `Your account is registered as "${userRole}". Only "coach" and "dietician" accounts can create packages.`
        );
        return null;
      }

      const payload = {
        ...(pkg.recordId ? { id: pkg.recordId } : {}),
        owner_user_id: userId,
        professional_type: PROFESSIONAL_TYPE, // 'coach'
        name: pkg.name,
        slug: pkg.slug || slugifyName(pkg.name),
        description: pkg.description,
        price: pkg.price,
        currency: 'INR',
        billing_cycle: 'monthly',
        billing_frequency: 1,
        feature_list: pkg.features,
        visibility: 'private',
        status: pkg.isActive ? 'active' : 'draft',
        metadata: {},
        is_default: pkg.isDefaultSeed ?? false,
      };

      console.log('[CoachSubscription] Persisting package:', {
        userId,
        userRole,
        professionalType: PROFESSIONAL_TYPE,
        packageId: pkg.id,
        packageName: pkg.name,
        isNewPackage: !pkg.recordId,
        payload,
      });

      // Verify user role matches professional_type before attempting upsert
      // This is critical for RLS policy to pass
      if (userRole !== PROFESSIONAL_TYPE) {
        console.error('[CoachSubscription] CRITICAL: User role does not match professional_type', {
          userRole,
          professionalType: PROFESSIONAL_TYPE,
          willFailRLS: true,
        });
        throw new Error(
          `Account role mismatch: Your account is "${userRole}" but trying to create "${PROFESSIONAL_TYPE}" package. ` +
          'Please verify your account is set up as a coach.'
        );
      }

      console.log('[CoachSubscription] Role verification passed - proceeding with upsert', {
        userId,
        userRole,
        packageId: pkg.id,
      });

      // CRITICAL: Ensure user exists in public.users table with correct role
      // If not, create them (should be rare if auth trigger exists)
      console.log('[CoachSubscription] Ensuring user exists in public.users...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (checkError || !existingUser) {
        console.warn('[CoachSubscription] User not found in public.users, attempting to create...');
        const { error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            role: userRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        if (createError) {
          console.error('[CoachSubscription] Failed to create user in public.users:', {
            error: createError.message,
            code: createError.code,
            details: createError.details,
            hint: createError.hint,
          });
          // Don't fail - user might already have permission issues, continue to package save
          console.warn('[CoachSubscription] Continuing despite user creation failure...');
        } else {
          console.log('[CoachSubscription] User created in public.users successfully');
        }
      } else if (existingUser.role !== userRole) {
        console.warn('[CoachSubscription] User role mismatch in database, updating...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: userRole, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) {
          console.error('[CoachSubscription] Failed to update user role:', {
            error: updateError.message,
            code: updateError.code,
            details: updateError.details,
          });
          // Don't fail - continue to package save
          console.warn('[CoachSubscription] Continuing despite role update failure...');
        } else {
          console.log('[CoachSubscription] User role updated in public.users');
        }
      } else {
        console.log('[CoachSubscription] User exists in public.users with correct role');
      }

      // Validate payload before sending
      if (!payload.owner_user_id) {
        throw new Error('Payload missing owner_user_id');
      }
      if (!payload.professional_type) {
        throw new Error('Payload missing professional_type');
      }
      if (!payload.name) {
        throw new Error('Payload missing package name');
      }

      console.log('[CoachSubscription] Payload validation passed. Sending upsert request:', {
        payloadKeys: Object.keys(payload),
        owner_user_id: payload.owner_user_id,
        professional_type: payload.professional_type,
        name: payload.name,
        isUpdate: !!payload.id,
      });

      // Log the full auth session to debug auth.uid() mismatch
      const { data: authSession } = await supabase.auth.getSession();
      console.log('[CoachSubscription] Current auth session:', {
        authUid: authSession?.session?.user?.id,
        authEmail: authSession?.session?.user?.email,
        payloadOwnerId: payload.owner_user_id,
        match: authSession?.session?.user?.id === payload.owner_user_id,
      });

      console.log('[CoachSubscription] Calling upsert...');
      const { data, error } = await supabase
        .from('professional_packages')
        .upsert(payload)
        .select('id, name, description, price, feature_list, status, slug, is_default');

      console.log('[CoachSubscription] Upsert response:', { hasError: !!error, hasData: !!data, dataLength: Array.isArray(data) ? data.length : null });

      if (error) {
        const errorSummary = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error),
        };
        
        console.error('[CoachSubscription] Upsert FAILED - Full Error:', errorSummary);
        console.error('[CoachSubscription] Error Details:', {
          payload,
          userId,
          userRole,
          errorMessage: error.message,
          errorCode: error.code,
        });

        // Provide specific guidance based on error type
        let userMessage = 'Unable to save package. ';
        if (error.message?.includes('permission denied') || error.message?.includes('Policy')) {
          userMessage += 'Permission denied by database policy. Your account role may not match the required role. Sign out and sign back in.';
        } else if (error.message?.includes('unique violation')) {
          userMessage += 'A package with this name already exists.';
        } else if (error.message?.includes('does not exist')) {
          userMessage += 'Database table is missing. Please contact support.';
        } else if (error.message?.includes('connection')) {
          userMessage += 'Network connection error. Please check your connection and retry.';
        } else {
          userMessage += `Error: ${error.message || 'Unknown error'}`;
        }

        throw new Error(userMessage);
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No response from server. Please check your connection and retry.');
      }

      // Handle both array and single response
      const responseData = Array.isArray(data) ? data[0] : data;
      const normalizedPackage = clonePackage(mapRowToPackage(responseData));
      normalizedPackage.isDefaultSeed = false;

      console.log('[CoachSubscription] Upsert SUCCESS:', {
        packageId: responseData.id,
        packageName: responseData.name,
        status: responseData.status,
      });

      // Show success alert
      setTimeout(() => {
        Alert.alert(
          'Success ✓',
          'The Package details are saved successfully',
          [{ text: 'OK' }]
        );
      }, 100);

      return normalizedPackage;
    } catch (err) {
      console.error('[CoachSubscription] Persist failed:', {
        error: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err,
        userRole: userRole,
        userId: userId,
      });
      Alert.alert(
        'Error',
        'Something went wrong. Please try again after sometime'
      );
      return null;
    } finally {
      setSyncingPackageId(null);
    }
  };

  const togglePackage = (id: string) => {
    const target = packages.find((pkg) => pkg.id === id);
    if (!target) return;

    const updated = { ...target, isActive: !target.isActive };
    setPackages((prev) => prev.map((pkg) => (pkg.id === id ? updated : pkg)));

    void (async () => {
      const persisted = await persistPackage(updated);
      if (persisted) {
        setPackages((prev) =>
          prev.map((pkg) => (pkg.id === updated.id ? clonePackage(persisted) : pkg))
        );
      } else {
        setPackages((prev) => prev.map((pkg) => (pkg.id === updated.id ? target : pkg)));
      }
    })();
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage({ ...pkg, features: [...pkg.features], newFeature: '' });
    setShowEditModal(true);
  };

  const savePackageChanges = async () => {
    try {
      console.log('[savePackageChanges] Started');
      if (!editingPackage) return;

      const trimmedName = editingPackage.name.trim();
      if (!trimmedName) {
        Alert.alert('Missing Details', 'Package name is required.');
        return;
      }

      const numericPrice = parseFloat(String(editingPackage.price));
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        Alert.alert('Missing Details', 'Price must be greater than 0.');
        return;
      }

      const normalizedFeatures = editingPackage.features
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);
      if (normalizedFeatures.length === 0) {
        Alert.alert('Missing Details', 'Add at least one feature.');
        return;
      }

      const sanitizedPackage: Package = {
        ...editingPackage,
        name: trimmedName,
        description: editingPackage.description.trim(),
        price: Math.round(numericPrice * 100) / 100,
        features: normalizedFeatures,
        slug: editingPackage.slug || slugifyName(trimmedName),
      };

      console.log('[savePackageChanges] Calling persistPackage...');
      const persisted = await persistPackage(sanitizedPackage);
      console.log('[savePackageChanges] persistPackage returned:', { hasPersisted: !!persisted, persistedId: persisted?.id });
      
      if (persisted) {
        console.log('[savePackageChanges] Success! Creating alert...');
        const normalized = clonePackage(persisted);
        setPackages((prev) => {
          const matchIndex = prev.findIndex((pkg) => pkg.id === sanitizedPackage.id);
          if (matchIndex === -1) {
            return [normalized, ...prev];
          }
          const next = [...prev];
          next[matchIndex] = normalized;
          return next;
        });
        
        // Close modal FIRST, then show success message
        console.log('[savePackageChanges] About to close modal...');
        closeModal();
        console.log('[savePackageChanges] Modal closed');
        
        // Scroll to top for visibility
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
        
        // Show success message with animation
        setSuccessMessage('The Package details are saved successfully');
        Animated.timing(successAnimValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          // Fade out animation
          Animated.timing(successAnimValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setSuccessMessage(null);
          });
        }, 3000);
        
        console.log('[CoachSubscription] Package saved successfully:', normalized);
      } else {
        // Auto-scroll to top for error visibility
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
        
        setErrorMessage('Something went wrong. Please try again after sometime');
        Animated.timing(errorAnimValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          // Fade out animation
          Animated.timing(errorAnimValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setErrorMessage(null);
          });
        }, 3000);
        console.log('[savePackageChanges] persistPackage returned null/falsy');
      }
    } catch (err) {
      console.error('[savePackageChanges] Exception caught:', err instanceof Error ? err.message : String(err));
      
      // Auto-scroll to top for error visibility
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      
      setErrorMessage('Something went wrong. Please try again after sometime');
      Animated.timing(errorAnimValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      setTimeout(() => {
        Animated.timing(errorAnimValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setErrorMessage(null);
        });
      }, 3000);
    }
  };

  const addFeature = () => {
    if (!editingPackage) return;

    const newFeature = editingPackage.newFeature.trim();
    if (!newFeature) {
      Alert.alert('Invalid Feature', 'Feature cannot be empty.');
      return;
    }

    setEditingPackage({
      ...editingPackage,
      features: [...editingPackage.features, newFeature],
      newFeature: '',
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      features: editingPackage.features.filter((_, i) => i !== index),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      {/* Success Toast Notification */}
      {successMessage && (
        <Animated.View
          style={[
            styles.successBanner,
            {
              opacity: successAnimValue,
              transform: [
                {
                  translateY: successAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel="Success message"
        >
          <View style={styles.successContent}>
            <MaterialIcons name="check-circle" size={20} color="#34c759" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Error Toast Notification */}
      {errorMessage && (
        <Animated.View
          style={[
            styles.errorBanner,
            {
              opacity: errorAnimValue,
              transform: [
                {
                  translateY: errorAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessibilityLabel="Error message"
        >
          <View style={styles.errorContent}>
            <MaterialIcons name="error" size={20} color="#ff3c20" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={28} color="#ff3c20" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscription Packages</Text>
          <Text style={styles.headerSubtitle}>Customize packages for your clients</Text>
          {loadingPackages && (
            <View style={styles.loadingBanner}>
              <ActivityIndicator size="small" color="#ff3c20" />
              <Text style={styles.loadingText}>Syncing your packages…</Text>
            </View>
          )}
        </View>

        {!loadingPackages && packages.length > 0 && packages.every((pkg) => pkg.isDefaultSeed && !pkg.recordId) && (
          <View style={styles.helperBanner}>
            <MaterialIcons name="lightbulb" size={18} color="#ff3c20" style={{ marginRight: 8 }} />
            <Text style={styles.helperBannerText}>
              These are default templates. Edit & save to publish them to your profile.
            </Text>
          </View>
        )}

        {/* Packages List */}
        <View style={styles.packagesContainer}>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.toggleWrapper}
                  onPress={() => {
                    if (!(syncingPackageId === pkg.id || loadingPackages)) {
                      togglePackage(pkg.id);
                    }
                  }}
                  disabled={syncingPackageId === pkg.id || loadingPackages}
                  activeOpacity={0.7}
                  accessible
                  accessibilityRole="switch"
                  accessibilityState={{ checked: pkg.isActive, disabled: syncingPackageId === pkg.id || loadingPackages }}
                  accessibilityLabel={`Toggle ${pkg.name} package`}
                >
                  <Switch
                    value={pkg.isActive}
                    onValueChange={() => togglePackage(pkg.id)}
                    trackColor={{ false: '#e5e5ea', true: '#ff3c20' }}
                    thumbColor={pkg.isActive ? '#ffffff' : '#f4f4f4'}
                    disabled={syncingPackageId === pkg.id || loadingPackages}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
              </View>

              {syncingPackageId === pkg.id && (
                <View style={styles.syncRow}>
                  <ActivityIndicator size="small" color="#ff3c20" />
                  <Text style={styles.syncText}>Saving changes…</Text>
                </View>
              )}

              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{pkg.price}</Text>
                <Text style={styles.priceLabel}>per month</Text>
              </View>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features:</Text>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#34c759"
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.editBtn, (syncingPackageId === pkg.id || loadingPackages) && styles.editBtnDisabled]}
                onPress={() => {
                  console.log('[CoachSubscription] Opening edit modal for:', pkg.name);
                  openEditModal(pkg);
                }}
                disabled={syncingPackageId === pkg.id || loadingPackages}
                activeOpacity={0.7}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Edit ${pkg.name} package`}
              >
                <MaterialIcons
                  name="edit"
                  size={18}
                  color={syncingPackageId === pkg.id || loadingPackages ? '#ccc' : '#ff3c20'}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.editBtnText, (syncingPackageId === pkg.id || loadingPackages) && { color: '#ccc' }]}>Edit Package</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add New Package Button */}
        <TouchableOpacity
          style={styles.addPackageBtn}
          onPress={() => {
            console.log('[CoachSubscription] Adding new package');
            handleAddPackage();
          }}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Add new package"
        >
          <MaterialIcons
            name="add"
            size={24}
            color="#ffffff"
            style={styles.buttonIcon}
          />
          <Text style={styles.addPackageBtnText}>Add New Package</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Package Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
        presentationStyle="overFullScreen"
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={closeModal}
        >
          <Pressable
            style={[styles.modalContainer, { paddingBottom: insets.bottom }]}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Package</Text>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.modalCloseBtn}
                >
                  <MaterialIcons name="close" size={24} color="#1d1d1f" />
                </TouchableOpacity>
              </View>

              {editingPackage && (
                <>
                  {/* Package Name */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Package Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingPackage.name}
                      onChangeText={(text) =>
                        setEditingPackage({ ...editingPackage, name: text })
                      }
                      placeholder="e.g., Basic, Premium, Elite"
                      placeholderTextColor="#9a9a9a"
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.textInput, { minHeight: 80 }]}
                      value={editingPackage.description}
                      onChangeText={(text) =>
                        setEditingPackage({ ...editingPackage, description: text })
                      }
                      placeholder="Short description of the package"
                      placeholderTextColor="#9a9a9a"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Price */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Price (₹) *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editingPackage.price.toString()}
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        setEditingPackage({
                          ...editingPackage,
                          price: isNaN(num) ? 0 : num,
                        });
                      }}
                      placeholder="Enter price"
                      placeholderTextColor="#9a9a9a"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Features Section */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Features *</Text>

                    {/* Features List */}
                    {editingPackage.features.length > 0 && (
                      <View style={styles.featuresList}>
                        {editingPackage.features.map((feature, idx) => (
                          <View key={idx} style={styles.featureChip}>
                            <Text style={styles.featureChipText} numberOfLines={1}>
                              {feature}
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeFeature(idx)}
                              style={styles.removeFeatureBtn}
                            >
                              <MaterialIcons name="close" size={16} color="#ff3c20" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add Feature Input */}
                    <View style={styles.addFeatureContainer}>
                      <TextInput
                        style={styles.addFeatureInput}
                        value={editingPackage.newFeature}
                        onChangeText={(text) =>
                          setEditingPackage({ ...editingPackage, newFeature: text })
                        }
                        placeholder="Add a new feature"
                        placeholderTextColor="#9a9a9a"
                      />
                      <TouchableOpacity
                        style={[styles.addFeatureBtn, !editingPackage.newFeature.trim() && styles.addFeatureBtnDisabled]}
                        onPress={addFeature}
                        disabled={!editingPackage.newFeature.trim()}
                      >
                        <MaterialIcons name="add" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={closeModal}
                      disabled={syncingPackageId === editingPackage.id}
                      activeOpacity={0.7}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Cancel editing"
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, syncingPackageId === editingPackage.id && styles.saveBtnDisabled]}
                      onPress={() => {
                        console.log('[CoachSubscription] Saving package changes for:', editingPackage?.name);
                        savePackageChanges();
                      }}
                      disabled={syncingPackageId === editingPackage.id}
                      activeOpacity={0.7}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Save package changes"
                    >
                      {syncingPackageId === editingPackage.id ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.saveBtnText}>Saving…</Text>
                        </View>
                      ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <FooterNav mode="coach" navigation={navigation} currentRoute="CoachSubscription" />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 12,
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#1d1d1f',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6e6e73',
    fontWeight: '500',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 60, 32, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#ff3c20',
    fontWeight: '600',
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 60, 32, 0.08)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 32, 0.16)',
    marginBottom: 20,
  },
  helperBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#7a2a23',
    fontWeight: '500',
  },
  unsyncedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(180, 83, 9, 0.08)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.2)',
    marginBottom: 20,
  },
  unsyncedBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#7a2a23',
    fontWeight: '500',
  },
  packagesContainer: {
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '400',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  syncText: {
    fontSize: 12,
    color: '#6e6e73',
    fontWeight: '500',
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '400',
  },
  featureIcon: {
    marginRight: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 60, 32, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 32, 0.2)',
  },
  editBtnDisabled: {
    opacity: 0.6,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3c20',
  },
  addPackageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addPackageBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalContent: {
    padding: 20,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  modalCloseBtn: {
    padding: 8,
    marginRight: -8,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#f9f9fb',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    marginRight: 8,
    marginBottom: 8,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1d1d1f',
    marginRight: 6,
    maxWidth: 150,
  },
  removeFeatureBtn: {
    padding: 4,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFeatureInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#f9f9fb',
    marginRight: 8,
  },
  addFeatureBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFeatureBtnDisabled: {
    backgroundColor: 'rgba(255, 60, 32, 0.4)',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    backgroundColor: '#f9f9fb',
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    shadowColor: '#ff3c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  priceContainer: {
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 60, 32, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 60, 32, 0.15)',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ff3c20',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6e6e73',
    fontWeight: '500',
    marginTop: 4,
  },
  toggleWrapper: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 60, 32, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBanner: {
    backgroundColor: '#D4EDDA',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C3E6CB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  successText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorBanner: {
    backgroundColor: '#F8D7DA',
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5C6CB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  errorText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#721C24',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default CoachSubscriptionNative;
