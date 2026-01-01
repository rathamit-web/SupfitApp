import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, FlatList, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabaseClient';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

const DEVICE_BRANDS = [
  'Apple Watch',
  'Google Pixel Watch',
  'Garmin',
  'Whoop',
  'Samsung Galaxy Watch',
  'Fitbit',
  'Other',
];

const UserSettingsNative = () => {
  const navigation = useNavigation();
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  useEffect(() => {
    (async () => {
      // Get user id
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) return;
      // Fetch settings from Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (data) {
        setConnectedDevices(data.connectedDevices || []);
        setIsProfilePublic(data.isProfilePublic ?? true);
        await AsyncStorage.setItem('connectedDevices', JSON.stringify(data.connectedDevices || []));
        await AsyncStorage.setItem('isProfilePublic', data.isProfilePublic ? 'true' : 'false');
      }
    })();
  }, []);

  // Manual vital entry state
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [vitalType, setVitalType] = useState('');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalUnit, setVitalUnit] = useState('');
  const [vitalDate, setVitalDate] = useState('');

  const openVitalModal = (type: string) => {
    setVitalType(type);
    setVitalValue('');
    setVitalUnit(type === 'Blood Sugar' ? 'mg/dL' : type === 'Blood Pressure' ? 'mmHg' : '');
    setVitalDate(new Date().toISOString().slice(0, 10));
    setShowVitalModal(true);
  };

  const handleSaveVital = async () => {
    if (!vitalValue || !vitalType) return;
    try {
      const user = await supabase.auth.getUser();
      const user_id = user?.data?.user?.id;
      if (!user_id) throw new Error('User not logged in');
      await supabase.from('manual_vitals').insert({
        user_id,
        type: vitalType,
        value: vitalValue,
        unit: vitalUnit,
        date: vitalDate,
      });
      setShowVitalModal(false);
      setVitalValue('');
      setVitalType('');
      setVitalUnit('');
      setVitalDate('');
      alert('Vital saved!');
    } catch (e: any) {
      alert(`Save failed: ${e.message || 'Could not save vital'}`);
    }
  };

  const handleFileUpload = async (type: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        const user = await supabase.auth.getUser();
        const user_id = user?.data?.user?.id;
        if (!user_id) throw new Error('User not logged in');
        const uri = result.assets[0].uri;
        const fileExt = uri.split('.').pop();
        const fileName = `healthdocs/${user_id}_${Date.now()}.${fileExt}`;
        const fileData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const { error: uploadError } = await supabase.storage
          .from('healthdocs')
          .upload(fileName, Buffer.from(fileData, 'base64'), { contentType: result.assets[0].mimeType || 'application/octet-stream', upsert: true });
        if (uploadError) throw uploadError;
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('healthdocs').getPublicUrl(fileName);
        const publicUrl = publicUrlData?.publicUrl;
        // Save metadata in Supabase
        await supabase.from('health_documents').insert({ user_id, type, name: result.assets[0].name, url: publicUrl });
        alert(`Uploaded ${type}: ${result.assets[0].name}`);
      } catch (e: any) {
        alert(`Upload failed: ${e.message || 'Could not upload file'}`);
      }
    }
  };

  const handleAddDevice = () => setShowDeviceModal(true);

  const handleConnectDevice = async () => {
    if (!selectedBrand) return;
    setIsConnecting(true);
    setTimeout(async () => {
      const updated = [...connectedDevices, selectedBrand];
      setConnectedDevices(updated);
      await AsyncStorage.setItem('connectedDevices', JSON.stringify(updated));
      setIsConnecting(false);
      setShowDeviceModal(false);
      setSelectedBrand('');
    }, 1500);
  };

  const handleProfileVisibility = async (val: boolean) => {
    setIsProfilePublic(val);
    await AsyncStorage.setItem('isProfilePublic', val ? 'true' : 'false');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Settings</Text>
        </View>

        {/* Profile Privacy */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isProfilePublic ? 'rgba(255,60,32,0.15)' : 'rgba(255,149,0,0.15)' }] }>
                <MaterialIcons name={isProfilePublic ? 'public' : 'lock'} size={24} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Profile Visibility</Text>
                <Text style={styles.cardDesc}>{isProfilePublic ? 'Your profile is public' : 'Your profile is private'}</Text>
              </View>
            </View>
            <Switch
              value={isProfilePublic}
              onValueChange={handleProfileVisibility}
              trackColor={{ false: '#e5e5e7', true: '#ff3c20' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* My Targets */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MyTargetsNative')}>
          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
                <MaterialIcons name="track-changes" size={24} color="#007aff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>My Targets</Text>
                <Text style={styles.cardDesc}>Set your fitness goals and milestones</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#6e6e73" />
          </View>
        </TouchableOpacity>

        {/* Connected Devices */}
        <View style={styles.card}>
          <View style={[styles.rowLeft, { marginBottom: 12 }] }>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
              <MaterialIcons name="watch" size={24} color="#ff3c20" />
            </View>
            <Text style={styles.cardTitle}>Connected Devices</Text>
          </View>
          {connectedDevices.length > 0 ? (
            <FlatList
              data={connectedDevices}
              keyExtractor={(item, idx) => item + idx}
              renderItem={({ item }) => (
                <View style={styles.deviceRow}>
                  <MaterialIcons name="bluetooth" size={18} color="#007aff" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 15, color: '#007aff' }}>{item}</Text>
                </View>
              )}
              style={{ marginBottom: 8 }}
            />
          ) : (
            <Text style={styles.cardDesc}>No device connected</Text>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={handleAddDevice}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Device</Text>
          </TouchableOpacity>
        </View>

        {/* Device Modal */}
        <Modal visible={showDeviceModal} transparent animationType="fade" onRequestClose={() => setShowDeviceModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Connect Smartwatch</Text>
              <Text style={styles.modalDesc}>Select your smartwatch brand to connect via Bluetooth</Text>
              <View style={styles.pickerWrap}>
                <FlatList
                  data={DEVICE_BRANDS}
                  keyExtractor={item => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.pickerItem, selectedBrand === item && styles.pickerItemSelected]}
                      onPress={() => setSelectedBrand(item)}
                      disabled={isConnecting}
                    >
                      <Text style={{ color: selectedBrand === item ? '#ff3c20' : '#1d1d1f', fontWeight: selectedBrand === item ? '700' : '500' }}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <TouchableOpacity
                style={[styles.connectBtn, (!selectedBrand || isConnecting) && { opacity: 0.6 }]}
                onPress={handleConnectDevice}
                disabled={!selectedBrand || isConnecting}
              >
                <MaterialIcons name="bluetooth" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.connectBtnText}>{isConnecting ? 'Connecting...' : 'Connect'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeviceModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Health Documents */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Health Documents</Text>
          <TouchableOpacity style={styles.docUpload} onPress={() => openVitalModal('Blood Sugar')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
                <MaterialIcons name="monitor-heart" size={20} color="#007aff" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Blood Sugar</Text>
                <Text style={styles.cardDesc}>Manual entry for blood sugar</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={20} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.docUpload} onPress={() => openVitalModal('Blood Pressure')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
                <MaterialIcons name="favorite" size={20} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Blood Pressure</Text>
                <Text style={styles.cardDesc}>Manual entry for blood pressure</Text>
              </View>
            </View>
            <MaterialIcons name="edit" size={20} color="#ff3c20" />
          </TouchableOpacity>
                  {/* Vital Manual Entry Modal */}
                  <Modal visible={showVitalModal} transparent animationType="fade" onRequestClose={() => setShowVitalModal(false)}>
                    <View style={styles.modalOverlay}>
                      <View style={[styles.modalContent, { minWidth: 320, alignItems: 'flex-start' }] }>
                        <Text style={styles.modalTitle}>Enter {vitalType}</Text>
                        <Text style={styles.modalDesc}>Add your {vitalType} value for trend analysis</Text>
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 12 }}
                          placeholder={`Enter ${vitalType} value`}
                          keyboardType="numeric"
                          value={vitalValue}
                          onChangeText={setVitalValue}
                        />
                        <Text style={{ fontSize: 15, color: '#6e6e73', marginBottom: 8 }}>{vitalUnit}</Text>
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, width: '100%', fontSize: 16, marginBottom: 12 }}
                          placeholder="YYYY-MM-DD"
                          value={vitalDate}
                          onChangeText={setVitalDate}
                        />
                        <TouchableOpacity style={[styles.connectBtn, { width: '100%' }]} onPress={handleSaveVital}>
                          <Text style={styles.connectBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowVitalModal(false)}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>
          {/* END Vital Manual Entry Modal */}

          {/* The following block was incorrectly nested, now fixed: */}
          <View style={styles.rowLeft}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,122,255,0.15)' }] }>
              <MaterialIcons name="monitor-heart" size={20} color="#007aff" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Vital Reports</Text>
              <Text style={styles.cardDesc}>Blood tests, vitals, and health metrics</Text>
            </View>
          </View>
          <MaterialIcons name="upload-file" size={20} color="#007aff" />
          <TouchableOpacity style={styles.docUpload} onPress={() => handleFileUpload('prescription')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(52,199,89,0.15)' }] }>
                <MaterialIcons name="medication" size={20} color="#34c759" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Prescriptions</Text>
                <Text style={styles.cardDesc}>Medical prescriptions and medications</Text>
              </View>
            </View>
            <MaterialIcons name="upload-file" size={20} color="#34c759" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.docUpload} onPress={() => handleFileUpload('medical')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,60,32,0.15)' }] }>
                <MaterialIcons name="favorite" size={20} color="#ff3c20" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Medical History</Text>
                <Text style={styles.cardDesc}>Past medical records and history</Text>
              </View>
            </View>
            <MaterialIcons name="upload-file" size={20} color="#ff3c20" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('IndividualUserHome')}>
          <MaterialIcons name="home-filled" size={28} color="#ff3c20" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('PlanNative')}>
          <MaterialIcons name="event" size={26} color="#6e6e73" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('HealthDashboard')}>
          <MaterialIcons name="dashboard" size={26} color="#6e6e73" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: 'rgba(255,60,32,0.08)' }]}>
          <MaterialIcons name="person" size={26} color="#ff3c20" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 90, paddingTop: 0 },
  header: { padding: 24, backgroundColor: 'rgba(255,255,255,0.85)', borderBottomWidth: 0.5, borderColor: '#e5e5ea' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ff3c20', letterSpacing: -0.5 },
  card: { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1d1d1f' },
  cardDesc: { fontSize: 14, color: '#6e6e73', marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff3c20', borderRadius: 12, padding: 12, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { minWidth: 320, backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: '#6e6e73', marginBottom: 16, textAlign: 'center' },
  pickerWrap: { width: '100%', maxHeight: 180, marginBottom: 16 },
  pickerItem: { padding: 12, borderRadius: 10, marginBottom: 6, backgroundColor: '#f5f5f7' },
  pickerItemSelected: { backgroundColor: 'rgba(255,60,32,0.12)' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff3c20', borderRadius: 12, padding: 14, width: '100%', marginTop: 8 },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { marginTop: 10, padding: 10 },
  cancelBtnText: { color: '#6e6e73', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1d1d1f', marginBottom: 12 },
  docUpload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  footerContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderTopWidth: 0.5, borderColor: '#e5e5ea', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, zIndex: 100 },
  footerBtn: { padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2 },
});

export default UserSettingsNative;
