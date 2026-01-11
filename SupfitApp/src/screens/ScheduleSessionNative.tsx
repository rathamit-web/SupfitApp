import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface TimeSlot {
  time: string;
  activity: string;
  notes: string;
}

interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

interface ScheduleSessionProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      clientId?: number;
    };
  };
}

const defaultSlots: TimeSlot[] = [
  { time: '5:00 AM - 7:00 AM', activity: 'Morning Cardio', notes: 'Running, cycling, or swimming' },
  { time: '7:00 AM - 9:00 AM', activity: 'Strength Training', notes: 'Upper body focus' },
  { time: '9:00 AM - 11:00 AM', activity: 'Yoga & Flexibility', notes: 'Stretching and mobility work' },
  { time: '11:00 AM - 1:00 PM', activity: 'HIIT Session', notes: 'High intensity interval training' },
  { time: '1:00 PM - 3:00 PM', activity: 'Rest & Recovery', notes: 'Light activity or rest' },
  { time: '3:00 PM - 5:00 PM', activity: 'Sports Activity', notes: 'Badminton, tennis, or team sports' },
  { time: '5:00 PM - 7:00 PM', activity: 'Evening Workout', notes: 'Lower body focus' },
  { time: '7:00 PM - 9:00 PM', activity: 'Cool Down', notes: 'Stretching and meditation' },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleSessionNative = ({ navigation, route }: ScheduleSessionProps) => {
  const clientId = route?.params?.clientId || 1;
  const [recommendedDay, setRecommendedDay] = useState<string | null>(null);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editedSchedule, setEditedSchedule] = useState<DaySchedule[]>(
    daysOfWeek.map(day => ({
      day,
      slots: structuredClone(defaultSlots),
    }))
  );

  const loadSchedule = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(`schedule_${clientId}`);
      if (stored) {
        const schedule = JSON.parse(stored);
        if (schedule?.recommendedDay) {
          setRecommendedDay(schedule.recommendedDay);
        }
        if (schedule?.schedules) {
          setEditedSchedule(schedule.schedules);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [clientId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleRecommend = async (dayIndex: number) => {
    const day = editedSchedule[dayIndex].day;
    setRecommendedDay(day);
    try {
      await AsyncStorage.setItem(
        `schedule_${clientId}`,
        JSON.stringify({
          recommendedDay: day,
          schedules: editedSchedule,
        })
      );
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const toggleEdit = (index: number) => {
    if (editingDayIndex === index) {
      setEditingDayIndex(null);
    } else {
      setEditingDayIndex(index);
    }
  };

  const updateSlot = (
    dayIndex: number,
    slotIndex: number,
    field: 'activity' | 'notes',
    value: string
  ) => {
    setEditedSchedule(prev => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        slots: updated[dayIndex].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        ),
      };
      return updated;
    });
  };

  const getGradientColors = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#ff3c20', '#ffb347'],
      ['#60a5fa', '#22d3ee'],
      ['#a78bfa', '#c084fc'],
      ['#34d399', '#10b981'],
      ['#fb923c', '#f97316'],
      ['#ec4899', '#f472b6'],
      ['#8b5cf6', '#a78bfa'],
    ];
    return gradients[index % gradients.length];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#fff7f5', '#f5f5f7']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Schedule</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {editedSchedule.map((daySchedule, dayIndex) => {
            const isEditing = editingDayIndex === dayIndex;
            const isRecommended = recommendedDay === daySchedule.day;
            const gradientColors = getGradientColors(dayIndex);

            return (
              <View key={daySchedule.day} style={styles.dayCard}>
                <View style={[styles.dayHeader, isRecommended && styles.dayHeaderRecommended]}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dayHeaderGradient}
                  />
                </View>

                <View style={styles.dayContent}>
                  <View style={styles.dayTitleRow}>
                    <Text style={styles.dayTitle}>{daySchedule.day}</Text>
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <MaterialIcons name="check-circle" size={16} color="#34c759" />
                        <Text style={styles.recommendedText}>Active</Text>
                      </View>
                    )}
                  </View>

                  {/* Time Slots */}
                  {daySchedule.slots.map((slot, slotIndex) => (
                    <View key={`${daySchedule.day}-${slotIndex}`} style={styles.slotContainer}>
                      <View style={styles.slotHeader}>
                        <MaterialIcons name="schedule" size={16} color="#ff3c20" />
                        <Text style={styles.slotTime}>{slot.time}</Text>
                      </View>

                      <View style={styles.slotContent}>
                        <Text style={styles.slotLabel}>Activity:</Text>
                        {isEditing ? (
                          <TextInput
                            style={styles.slotInput}
                            value={slot.activity}
                            onChangeText={(text) =>
                              updateSlot(dayIndex, slotIndex, 'activity', text)
                            }
                            placeholder="Enter activity"
                            placeholderTextColor="#b0b0b0"
                          />
                        ) : (
                          <Text style={styles.slotText}>{slot.activity}</Text>
                        )}
                      </View>

                      <View style={styles.slotContent}>
                        <Text style={styles.slotLabel}>Notes:</Text>
                        {isEditing ? (
                          <TextInput
                            style={styles.slotInput}
                            value={slot.notes}
                            onChangeText={(text) =>
                              updateSlot(dayIndex, slotIndex, 'notes', text)
                            }
                            placeholder="Enter notes"
                            placeholderTextColor="#b0b0b0"
                            multiline
                          />
                        ) : (
                          <Text style={styles.slotText}>{slot.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleRecommend(dayIndex)}
                      style={[styles.recommendButton, isRecommended && styles.recommendedButton]}
                    >
                      <LinearGradient
                        colors={isRecommended ? ['#e0f7e0', '#e0f7e0'] : gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                      >
                        <Text
                          style={[
                            styles.recommendButtonText,
                            isRecommended && styles.recommendedButtonText,
                          ]}
                        >
                          {isRecommended ? 'Selected' : 'Assign'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => toggleEdit(dayIndex)}
                      style={styles.modifyButton}
                    >
                      <Text style={styles.modifyButtonText}>
                        {isEditing ? 'Save' : 'Modify'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff3c20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#ff3c20',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    flex: 1,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  dayCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dayHeader: {
    height: 8,
  },
  dayHeaderRecommended: {
    height: 10,
  },
  dayHeaderGradient: {
    flex: 1,
  },
  dayContent: {
    padding: 20,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    flex: 1,
    letterSpacing: -0.3,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34c759',
  },
  slotContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff3c20',
    letterSpacing: -0.2,
  },
  slotContent: {
    marginBottom: 8,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 6,
  },
  slotText: {
    fontSize: 15,
    color: '#1d1d1f',
    lineHeight: 22,
    fontWeight: '400',
  },
  slotInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#1d1d1f',
    backgroundColor: '#fff',
    minHeight: 44,
    lineHeight: 22,
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  recommendButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  recommendedButton: {
    borderWidth: 2,
    borderColor: '#34c759',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  recommendedButtonText: {
    color: '#34c759',
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ff3c20',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ff3c20',
    letterSpacing: -0.2,
  },
});

export default ScheduleSessionNative;
