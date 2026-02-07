/**
 * LocationCaptureSection Component
 * 
 * Implements enterprise location capture following:
 * - Meta: Privacy-first, explicit opt-in, user-controlled
 * - Google: Progressive disclosure (address → GPS)
 * - Amazon: Multi-layer fallback with quality scoring
 * 
 * Component handles:
 * 1. Permission request with clear explanation
 * 2. Progressive capture: address first, then GPS optional
 * 3. Location quality display with transparency
 * 4. Explicit revocation option (privacy-first)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  AlertIOS,
  Platform,
  StyleSheet,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { locationService, LocationData, LocationPrecisionSource, LocationQualityTier } from '../lib/locationService';
import { supabase } from '../lib/supabaseClient';

interface LocationCaptureSectionProps {
  addressInfo: {
    line1: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  onLocationUpdate?: (location: LocationData) => void;
}

const LocationCaptureSection: React.FC<LocationCaptureSectionProps> = ({ addressInfo, onLocationUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geoPermissionStatus, setGeoPermissionStatus] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [allowBackgroundLocation, setAllowBackgroundLocation] = useState(false);
  const [showQualityBreakdown, setShowQualityBreakdown] = useState(false);

  // Load current location on mount
  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const cached = await locationService.getCachedLocation();
      if (cached) {
        setCurrentLocation(cached);
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  };

  /**
   * Check current permission status without requesting
   */
  const checkPermissions = async () => {
    try {
      const permissions = await locationService.checkLocationPermissions();
      setGeoPermissionStatus(permissions.foreground);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  /**
   * Step 1: Request location permissions (Privacy-first, explicit)
   * User must opt-in; can revoke at any time
   */
  const handleRequestPermissions = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const permissions = await locationService.requestLocationPermissions(allowBackgroundLocation);

      setGeoPermissionStatus(permissions.foreground);

      if (permissions.foreground !== 'granted') {
        const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
        const message =
          `Location permission denied on ${platform}. ` +
          `To enable, go to Settings > SupfitApp > Location, then select "Always" or "While Using App"`;

        if (Platform.OS === 'ios') {
          AlertIOS.alert('Location Permission Required', message, [
            { text: 'OK', onPress: () => {} },
            {
              text: 'Open Settings',
              onPress: () => {
                // Note: On real device, this would use react-native-app-settings
                // For now, just show the message
              },
            },
          ]);
        } else {
          alert(message);
        }

        setLocationError('Permission denied. Location features unavailable.');
        return;
      }

      alert('Location permission granted! You can now capture your location.');
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to request permissions');
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Step 2: Capture GPS location (optional, higher quality)
   * Only works if permission granted
   */
  const handleCaptureGPS = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const permissions = await locationService.checkLocationPermissions();
      if (permissions.foreground !== 'granted') {
        setLocationError('Location permission required. Please enable it in settings.');
        return;
      }

      const gpsLocation = await locationService.captureGPSLocation(true);

      if (!gpsLocation) {
        setLocationError('Unable to get GPS location. Please try again.');
        return;
      }

      setCurrentLocation(gpsLocation);

      // Save to database
      const user = await supabase.auth.getUser();
      if (user.data.user?.id) {
        await locationService.saveLocationToDatabase(user.data.user.id, gpsLocation);
      }

      if (onLocationUpdate) {
        onLocationUpdate(gpsLocation);
      }

      alert(`Location captured!\nAccuracy: ±${gpsLocation.accuracyMeters?.toFixed(0) || '?'}m\nQuality Score: ${gpsLocation.qualityScore}/100`);
    } catch (error) {
      console.error('Error capturing GPS location:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to capture location');
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Step 3: Geocode address (highest quality without GPS)
   * Uses Google Places Geocoding API
   * No permission required; user-controlled
   */
  const handleGeocodeAddress = async () => {
    try {
      if (!addressInfo.line1 || !addressInfo.city || !addressInfo.state || !addressInfo.postal) {
        setLocationError('Please fill in complete address first (Line 1, City, State, Postal)');
        return;
      }

      setLocationLoading(true);
      setLocationError(null);

      const addressLocation = await locationService.geocodeAddress(
        addressInfo.line1,
        addressInfo.city,
        addressInfo.state,
        addressInfo.postal,
        addressInfo.country || 'India'
      );

      if (!addressLocation) {
        setLocationError('Could not geocode address. Please verify it is correct.');
        return;
      }

      setCurrentLocation(addressLocation);

      // Save to database
      const user = await supabase.auth.getUser();
      if (user.data.user?.id) {
        await locationService.saveLocationToDatabase(user.data.user.id, addressLocation);
      }

      if (onLocationUpdate) {
        onLocationUpdate(addressLocation);
      }

      alert(`Address geocoded successfully!\nQuality Score: ${addressLocation.qualityScore}/100`);
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to geocode address');
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Revoke all location permissions and clear cache (Meta privacy-first)
   */
  const handleRevokeLocation = async () => {
    try {
      setLocationLoading(true);

      await locationService.revokeLocationPermissions();
      await locationService.clearLocationCache();

      setCurrentLocation(null);
      setGeoPermissionStatus(null);

      alert('Location permissions revoked. All location data cleared.');
    } catch (error) {
      console.error('Error revoking location:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to revoke permissions');
    } finally {
      setLocationLoading(false);
    }
  };

  /**
   * Utility: Get quality label and color
   */
  const getQualityDisplay = (location: LocationData) => {
    const qualityColors = {
      high: '#34C759',
      medium: '#FF9500',
      low: '#FF6B6B',
      unavailable: '#999999',
    };

    const qualityMessages = {
      high: 'Excellent - High precision',
      medium: 'Good - Medium precision',
      low: 'Fair - Low precision',
      unavailable: 'No location available',
    };

    return {
      color: qualityColors[location.qualityTier] || '#999999',
      label: qualityMessages[location.qualityTier] || 'Unknown',
    };
  };

  const qualityDisplay = currentLocation ? getQualityDisplay(currentLocation) : null;

  return (
    <View style={styles.container}>
      {/* Current Location Display */}
      {currentLocation && (
        <View style={styles.locationCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="location-on" size={24} color={qualityDisplay?.color} />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.locationRow}>
              <Text style={styles.label}>Coordinates:</Text>
              <Text style={styles.value}>
                {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.label}>Quality Score:</Text>
              <View style={[styles.qualityBadge, { backgroundColor: qualityDisplay?.color }]}>
                <Text style={styles.qualityText}>{currentLocation.qualityScore}/100</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.label}>Source:</Text>
              <Text style={styles.value}>
                {currentLocation.precisionSource.toUpperCase()}
                {currentLocation.accuracyMeters && ` (±${currentLocation.accuracyMeters.toFixed(0)}m)`}
              </Text>
            </View>

            {/* Expandable quality breakdown */}
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowQualityBreakdown(!showQualityBreakdown)}
            >
              <Text style={styles.expandButtonText}>
                {showQualityBreakdown ? '▼ Hide Details' : '▶ Show Quality Breakdown'}
              </Text>
            </TouchableOpacity>

            {showQualityBreakdown && (
              <View style={styles.qualityBreakdown}>
                <Text style={styles.breakdownLabel}>Quality Factors:</Text>
                <Text style={styles.breakdownItem}>
                  • Source: {currentLocation.precisionSource === 'gps' ? '100 pts' : currentLocation.precisionSource === 'address' ? '85 pts' : '50 pts'}
                </Text>
                <Text style={styles.breakdownItem}>
                  • Age: Recent capture (high score)
                </Text>
                {currentLocation.accuracyMeters && (
                  <Text style={styles.breakdownItem}>• Accuracy: ±{currentLocation.accuracyMeters.toFixed(0)}m</Text>
                )}
                <Text style={styles.breakdownNote}>
                  Score used in matching algorithm to weight proximity signal. Higher score = more precise matches.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.revokeButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                AlertIOS.alert(
                  'Revoke Location Permission?',
                  'This will clear all saved location data and disable location-based features.',
                  [
                    { text: 'Cancel', onPress: () => {} },
                    { text: 'Revoke', onPress: handleRevokeLocation, style: 'destructive' },
                  ]
                );
              } else {
                alert('Revoke location permission? This will clear all saved location data.');
                handleRevokeLocation();
              }
            }}
            disabled={locationLoading}
          >
            <MaterialIcons name="delete" size={18} color="#FF6B6B" />
            <Text style={styles.revokeButtonText}>Revoke Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {!currentLocation && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleRequestPermissions}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="my-location" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Request Permission</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {geoPermissionStatus === 'granted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleCaptureGPS}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="gps-fixed" size={18} color="#007AFF" />
                <Text style={[styles.buttonText, { color: '#007AFF' }]}>Capture GPS</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={handleGeocodeAddress}
          disabled={locationLoading || !addressInfo.city}
        >
          {locationLoading ? (
            <ActivityIndicator color="#555" size="small" />
          ) : (
            <>
              <MaterialIcons name="place" size={18} color="#555" />
              <Text style={[styles.buttonText, { color: '#555' }]}>Geocode Address</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Background Location Option */}
      {!currentLocation && (
        <View style={styles.optionsRow}>
          <Text style={styles.optionLabel}>Allow Background Location Updates</Text>
          <Switch
            value={allowBackgroundLocation}
            onValueChange={setAllowBackgroundLocation}
          />
        </View>
      )}

      {/* Error Message */}
      {locationError && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error" size={18} color="#FF6B6B" />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <MaterialIcons name="info" size={16} color="#666" />
        <Text style={styles.privacyText}>
          Your location helps us find nearby professionals. You can revoke permission anytime. All location data is encrypted
          and stored securely.
        </Text>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginVertical: 12,
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    color: '#000',
  },
  cardContent: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  expandButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  qualityBreakdown: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  breakdownItem: {
    fontSize: 12,
    color: '#666',
    marginVertical: 3,
  },
  breakdownNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#E3F2FD',
  },
  tertiaryButton: {
    backgroundColor: '#F5F5F5',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFF0F0',
    gap: 4,
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    marginVertical: 12,
  },
  optionLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#FFE0E0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#D70015',
    fontWeight: '500',
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default LocationCaptureSection;
