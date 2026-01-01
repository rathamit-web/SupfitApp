
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

export default function UserSettings({ navigation }: any) {
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  // Load connected devices from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('connectedDevices').then((data) => {
      if (data) setConnectedDevices(JSON.parse(data));
    });
  }, []);

  const handleToggleProfile = async () => {
    setIsProfilePublic((prev) => !prev);
    await AsyncStorage.setItem('isProfilePublic', JSON.stringify(!isProfilePublic));
  };

  const handleConnectDevice = async () => {
    if (!selectedBrand) return;
    setIsConnecting(true);
    setTimeout(async () => {
      const updated = [...connectedDevices, selectedBrand];
      setConnectedDevices(updated);
      await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
      setIsConnecting(false);
      setSelectedBrand('');
    }, 1200);
  };

  return (
    <LinearGradient colors={["#fff7f5", "#f5f5f7"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconWrapBlue}>
              <Icon name="user" size={24} color="#2078ff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Profile Visibility</Text>
              <Text style={styles.cardSubtitle}>Make your profile public or private</Text>
            </View>
            <Switch
              value={isProfilePublic}
              onValueChange={handleToggleProfile}
              thumbColor={isProfilePublic ? '#ff3c20' : '#e5e5e7'}
              trackColor={{ false: '#e5e5e7', true: '#ffb3a7' }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconWrapGreen}>
              <Icon name="watch" size={24} color="#34c759" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Connect Device</Text>
              <Text style={styles.cardSubtitle}>Sync your smartwatch or fitness tracker</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.connectBtn, pressed && { backgroundColor: '#e5e5e7' }]}
              onPress={handleConnectDevice}
              accessibilityLabel="Connect Device"
            >
              <Text style={{ color: '#ff3c20', fontWeight: '600' }}>
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
            {['Apple Watch', 'Fitbit', 'Garmin'].map((brand) => (
              <Pressable
                key={brand}
                style={({ pressed }) => [
                  styles.deviceBrand,
                  selectedBrand === brand && { borderColor: '#ff3c20', backgroundColor: '#fff7f5' },
                  pressed && { backgroundColor: '#ffe5e0' },
                ]}
                onPress={() => setSelectedBrand(brand)}
                accessibilityLabel={`Select ${brand}`}
              >
                <Text style={{ color: '#1d1d1f', fontWeight: '500' }}>{brand}</Text>
              </Pressable>
            ))}
          </View>
          {connectedDevices.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: '600', color: '#6e6e73', marginBottom: 6 }}>Connected Devices:</Text>
              {connectedDevices.map((dev) => (
                <Text key={dev} style={{ color: '#1d1d1f', fontSize: 14, marginBottom: 2 }}>• {dev}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapBlue: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapGreen: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e6fbe9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6e6e73',
    marginTop: 2,
  },
  connectBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff3c20',
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  deviceBrand: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    backgroundColor: '#fff',
  },
});
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e5e7',
              backgroundColor: '#fff',
            },
});
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background:
                    'linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(10, 132, 255, 0.15) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target style={{ width: '24px', height: '24px', color: '#007aff' }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 4px 0',
                  }}
                >
                  My Targets
                </h3>
                <p style={{ fontSize: '14px', color: '#6e6e73', margin: 0 }}>
                  Set your fitness goals and milestones
                </p>
              </div>
            </div>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#6e6e73' }} />
          </div>
        </button>

        {/* Connect Device */}
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Watch style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
              Connected Device
            </h3>
          </div>
          {connectedDevices.length > 0 ? (
            <ul style={{ margin: '0 0 12px 0', padding: 0, listStyle: 'none' }}>
              {connectedDevices.map((dev, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '15px',
                    color: '#007aff',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Bluetooth style={{ width: '18px', height: '18px', color: '#007aff' }} />
                  {dev}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '12px' }}>
              No device connected
            </p>
          )}
          <button
            onClick={handleAddDevice}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ff3c20 0%, #ff5722 100%)',
              color: '#fff',
              fontWeight: '600',
              fontSize: '16px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,60,32,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <Plus style={{ width: '20px', height: '20px' }} /> Add Device
          </button>
        </div>

        {/* Device Modal */}
        {showDeviceModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.18)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => !isConnecting && setShowDeviceModal(false)}
          >
            <div
              style={{
                minWidth: '340px',
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                alignItems: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#1d1d1f',
                  marginBottom: '8px',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Arial, sans-serif',
                }}
              >
                Connect Smartwatch
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#6e6e73',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Select your smartwatch brand to connect via Bluetooth
              </p>
              <select
                value={selectedBrand}
                export default function UserSettings({ navigation }: any) {
                  const [isProfilePublic, setIsProfilePublic] = useState(true);
                  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
                  const [isConnecting, setIsConnecting] = useState(false);
                  const [selectedBrand, setSelectedBrand] = useState('');

                  useEffect(() => {
                    AsyncStorage.getItem('connectedDevices').then((data) => {
                      if (data) setConnectedDevices(JSON.parse(data));
                    });
                  }, []);

                  const handleToggleProfile = async () => {
                    setIsProfilePublic((prev) => !prev);
                    await AsyncStorage.setItem('isProfilePublic', JSON.stringify(!isProfilePublic));
                  };

                  const handleConnectDevice = async () => {
                    if (!selectedBrand) return;
                    setIsConnecting(true);
                    setTimeout(async () => {
                      const updated = [...connectedDevices, selectedBrand];
                      setConnectedDevices(updated);
                      await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
                      setIsConnecting(false);
                      setSelectedBrand('');
                      Alert.alert('Device Connected', `${selectedBrand} has been connected.`);
                    }, 1500);
                  };

                  return (
                    <LinearGradient colors={["#fafafa", "#f5f5f7"]} style={styles.container}>
                      <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Header */}
                        <View style={styles.header}>
                          <Text style={styles.headerTitle}>User Settings</Text>
                        </View>

                        {/* Profile Privacy */}
                        <View style={styles.card}>
                          <View style={styles.cardRow}>
                            <View style={styles.iconWrap}>
                              <Icon name={isProfilePublic ? 'globe' : 'lock'} size={24} color="#ff3c20" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardTitle}>Profile Visibility</Text>
                              <Text style={styles.cardSubtitle}>
                                {isProfilePublic ? 'Your profile is public' : 'Your profile is private'}
                              </Text>
                            </View>
                            <Switch
                              value={isProfilePublic}
                              onValueChange={handleToggleProfile}
                              thumbColor={isProfilePublic ? '#ff3c20' : '#e5e5e7'}
                              trackColor={{ false: '#e5e5e7', true: '#ff3c20' }}
                            />
                          </View>
                        </View>

                        {/* My Targets */}
                        <Pressable style={styles.card} onPress={() => navigation.navigate('MyTargets')} accessibilityLabel="My Targets">
                          <View style={styles.cardRow}>
                            <View style={styles.iconWrapBlue}>
                              <Icon name="target" size={24} color="#007aff" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardTitle}>My Targets</Text>
                              <Text style={styles.cardSubtitle}>Set your fitness goals and milestones</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#6e6e73" />
                          </View>
                        </Pressable>

                        {/* Connect Device */}
                        <View style={styles.card}>
                          <View style={styles.cardRow}>
                            <View style={styles.iconWrapGreen}>
                              <Icon name="watch" size={24} color="#34c759" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cardTitle}>Connect Device</Text>
                              <Text style={styles.cardSubtitle}>Sync your smartwatch or fitness tracker</Text>
                            </View>
                            <Pressable
                              style={({ pressed }) => [styles.connectBtn, pressed && { backgroundColor: '#e5e5e7' }]}
                              onPress={handleConnectDevice}
                              accessibilityLabel="Connect Device"
                            >
                              <Text style={{ color: '#ff3c20', fontWeight: '600' }}>
                                {isConnecting ? 'Connecting...' : 'Connect'}
                              </Text>
                            </Pressable>
                          </View>
                          <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                            {['Apple Watch', 'Fitbit', 'Garmin'].map((brand) => (
                              <Pressable
                                key={brand}
                                style={({ pressed }) => [
                                  styles.deviceBrand,
                                  selectedBrand === brand && { borderColor: '#ff3c20', backgroundColor: '#fff7f5' },
                                  pressed && { backgroundColor: '#ffe5e0' },
                                ]}
                                onPress={() => setSelectedBrand(brand)}
                                accessibilityLabel={`Select ${brand}`}
                              >
                                <Text style={{ color: '#1d1d1f', fontWeight: '500' }}>{brand}</Text>
                              </Pressable>
                            ))}
                          </View>
                          {connectedDevices.length > 0 && (
                            <View style={{ marginTop: 16 }}>
                              <Text style={{ fontWeight: '600', color: '#6e6e73', marginBottom: 6 }}>Connected Devices:</Text>
                              {connectedDevices.map((dev) => (
                                <Text key={dev} style={{ color: '#1d1d1f', fontSize: 14, marginBottom: 2 }}>• {dev}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </ScrollView>
                    </LinearGradient>
                  );
                }
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Vital Reports
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Blood tests, vitals, and health metrics
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#007aff' }} />
            </div>
            <input
              id="vital-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('vital')}
            />
          </label>

          {/* Prescription */}
          <label
            htmlFor="prescription-upload"
            style={{
              display: 'block',
              padding: '16px',
              background: 'rgba(52, 199, 89, 0.05)',
              borderRadius: '14px',
              marginBottom: '12px',
              cursor: 'pointer',
              border: '1px dashed rgba(52, 199, 89, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52, 199, 89, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(52, 199, 89, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(52, 199, 89, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pill style={{ width: '20px', height: '20px', color: '#34c759' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Prescriptions
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Medical prescriptions and medications
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#34c759' }} />
            </div>
            <input
              id="prescription-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('prescription')}
            />
          </label>

          {/* Medical History */}
          <label
            htmlFor="medical-upload"
            style={{
              display: 'block',
              padding: '16px',
              background: 'rgba(255, 60, 32, 0.05)',
              borderRadius: '14px',
              cursor: 'pointer',
              border: '1px dashed rgba(255, 60, 32, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 60, 32, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 60, 32, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 60, 32, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 60, 32, 0.3)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255, 60, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileHeart style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    margin: '0 0 2px 0',
                  }}
                >
                  Medical History
                </h3>
                <p style={{ fontSize: '13px', color: '#6e6e73', margin: 0 }}>
                  Past medical records and history
                </p>
              </div>
              <Upload style={{ width: '20px', height: '20px', color: '#ff3c20' }} />
            </div>
            <input
              id="medical-upload"
              type="file"
              accept=".pdf,.jpg,.png"
              style={{ display: 'none' }}
              onChange={() => handleFileUpload('medical')}
            />
          </label>
        </div>
      </div>

      {/* Footer Navigation */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 1000,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        {[
          { icon: Home, path: '/home' },
          { icon: Dumbbell, path: '/plan' },
          { icon: LayoutDashboard, path: '/coach-home' },
          { icon: User, path: '/settings' },
        ].map((item, index) => {
          const isActive = window.location.pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => (window.location.href = item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                </LinearGradient>
              );
            }
                cursor: 'pointer',
