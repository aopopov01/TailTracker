import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Calendar from 'expo-calendar';

const COLORS = {
  lightCyan: '#5DD4DC',
  midCyan: '#4BA8B5',
  deepNavy: '#1B3A57',
  white: '#FFFFFF',
  softGray: '#F8FAFB',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time: Date;
  type: 'appointment' | 'medication' | 'grooming' | 'vaccination' | 'reminder' | 'other';
  petId?: string;
  location?: string;
  calendarEventId?: string;
  completed: boolean;
}

const eventTypeConfig = {
  appointment: {
    icon: 'medical' as keyof typeof Ionicons.glyphMap,
    color: COLORS.lightCyan,
    label: 'Vet Appointment'
  },
  medication: {
    icon: 'medical' as keyof typeof Ionicons.glyphMap,
    color: COLORS.warning,
    label: 'Medication'
  },
  grooming: {
    icon: 'cut' as keyof typeof Ionicons.glyphMap,
    color: COLORS.success,
    label: 'Grooming'
  },
  vaccination: {
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    color: COLORS.error,
    label: 'Vaccination'
  },
  reminder: {
    icon: 'notifications' as keyof typeof Ionicons.glyphMap,
    color: COLORS.mediumGray,
    label: 'Reminder'
  },
  other: {
    icon: 'calendar' as keyof typeof Ionicons.glyphMap,
    color: COLORS.deepNavy,
    label: 'Other'
  }
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState<boolean | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    type: 'appointment',
    date: new Date(),
    time: new Date(),
    completed: false,
  });

  useEffect(() => {
    loadEvents();
    checkCalendarPermission();
  }, []);

  const loadEvents = async () => {
    try {
      // Load events from database/calendar
      // TODO: Implement real database integration
      setEvents([]);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    }
  };

  const checkCalendarPermission = async () => {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      setCalendarPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking calendar permission:', error);
      setCalendarPermission(false);
    }
  };

  const requestCalendarPermission = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
      Alert.alert('Error', 'Failed to request calendar permission');
      return false;
    }
  };

  const syncToPhoneCalendar = async (event: ScheduleEvent) => {
    try {
      if (!calendarPermission) {
        const granted = await requestCalendarPermission();
        if (!granted) {
          Alert.alert(
            'Calendar Access Required',
            'Please grant calendar permission to sync events with your phone calendar.',
            [
              { text: 'Cancel' },
              { text: 'Settings', onPress: () => {/* Open settings */} }
            ]
          );
          return;
        }
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync();
      const defaultCalendar = calendars.find(cal => cal.source.name === 'Default') || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No calendar available for sync');
        return;
      }

      // Combine date and time
      const eventDateTime = new Date(event.date);
      eventDateTime.setHours(
        event.time.getHours(),
        event.time.getMinutes(),
        0, 0
      );

      const calendarEvent = {
        title: event.title,
        startDate: eventDateTime,
        endDate: new Date(eventDateTime.getTime() + 3600000), // 1 hour duration
        notes: event.description,
        location: event.location,
        alarms: [{ relativeOffset: -60 }], // 1 hour before
      };

      const calendarEventId = await Calendar.createEventAsync(defaultCalendar.id, calendarEvent);
      
      // Update event with calendar ID
      setEvents(prev => prev.map(e => 
        e.id === event.id 
          ? { ...e, calendarEventId } 
          : e
      ));

      Alert.alert('Success', 'Event synced to your calendar!');
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      Alert.alert('Error', 'Failed to sync event to calendar');
    }
  };

  const handleAddEvent = () => {
    setShowAddForm(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const event: ScheduleEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type || 'other',
      location: newEvent.location,
      completed: false,
    };

    setEvents(prev => [...prev, event].sort((a, b) => a.date.getTime() - b.date.getTime()));
    setNewEvent({
      type: 'appointment',
      date: new Date(),
      time: new Date(),
      completed: false,
    });
    setShowAddForm(false);
    
    Alert.alert('Success', 'Event added successfully!');
  };

  const handleCompleteEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, completed: !event.completed }
        : event
    ));
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setEvents(prev => prev.filter(event => event.id !== eventId))
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleBack = () => {
    router.back();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    if (selectedDate) {
      setNewEvent(prev => ({ ...prev, date: selectedDate }));
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    
    if (selectedTime) {
      setNewEvent(prev => ({ ...prev, time: selectedTime }));
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  };

  const upcomingEvents = events.filter(event => !event.completed && event.date >= new Date());
  const completedEvents = events.filter(event => event.completed);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity style={styles.headerAddButton} onPress={handleAddEvent}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Calendar Sync Status */}
        <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.syncSection}>
          <View style={styles.syncHeader}>
            <View style={styles.syncInfo}>
              <Ionicons 
                name={calendarPermission ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={calendarPermission ? COLORS.success : COLORS.warning} 
              />
              <Text style={styles.syncText}>
                Calendar Sync: {calendarPermission ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            {!calendarPermission && (
              <TouchableOpacity 
                style={styles.enableSyncButton}
                onPress={requestCalendarPermission}
              >
                <Text style={styles.enableSyncText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Upcoming Events */}
        <Animated.View 
          entering={SlideInDown.delay(400).springify()} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Upcoming Events ({upcomingEvents.length})
          </Text>
          
          {upcomingEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyStateText}>No upcoming events</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to schedule your first event
              </Text>
            </View>
          ) : (
            upcomingEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={SlideInDown.delay(500 + index * 100).springify()}
                style={styles.eventCard}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventTypeIndicator}>
                    <View 
                      style={[
                        styles.eventTypeIcon,
                        { backgroundColor: eventTypeConfig[event.type].color }
                      ]}
                    >
                      <Ionicons 
                        name={eventTypeConfig[event.type].icon} 
                        size={16} 
                        color={COLORS.white} 
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDateTime}>
                        {formatDate(event.date)} at {formatTime(event.time)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.eventActions}>
                    {calendarPermission && !event.calendarEventId && (
                      <TouchableOpacity
                        style={styles.syncButton}
                        onPress={() => syncToPhoneCalendar(event)}
                      >
                        <Ionicons name="calendar" size={16} color={COLORS.lightCyan} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => handleCompleteEvent(event.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEvent(event.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                
                {event.location && (
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.locationText}>{event.location}</Text>
                  </View>
                )}
                
                {event.calendarEventId && (
                  <View style={styles.syncedIndicator}>
                    <Ionicons name="checkmark" size={12} color={COLORS.success} />
                    <Text style={styles.syncedText}>Synced to calendar</Text>
                  </View>
                )}
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <Animated.View 
            entering={SlideInDown.delay(600).springify()} 
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              Completed ({completedEvents.length})
            </Text>
            
            {completedEvents.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={SlideInDown.delay(700 + index * 50).springify()}
                style={[styles.eventCard, styles.completedEventCard]}
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventTypeIndicator}>
                    <View 
                      style={[
                        styles.eventTypeIcon,
                        styles.completedEventIcon,
                        { backgroundColor: COLORS.success }
                      ]}
                    >
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, styles.completedEventTitle]}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventDateTime}>
                        Completed on {formatDate(event.date)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.undoButton}
                    onPress={() => handleCompleteEvent(event.id)}
                  >
                    <Ionicons name="reload-outline" size={16} color={COLORS.mediumGray} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>      {/* Add Event Form Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Schedule Event</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Event Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.title || ''}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
                  placeholder="e.g., Vet Appointment, Grooming"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newEvent.type === type && styles.selectedTypeOption
                      ]}
                      onPress={() => setNewEvent(prev => ({ ...prev, type: type as any }))}
                    >
                      <View 
                        style={[
                          styles.typeOptionIcon,
                          { backgroundColor: config.color },
                          newEvent.type === type && styles.selectedTypeOptionIcon
                        ]}
                      >
                        <Ionicons name={config.icon} size={16} color={COLORS.white} />
                      </View>
                      <Text style={[
                        styles.typeOptionText,
                        newEvent.type === type && styles.selectedTypeOptionText
                      ]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Date *</Text>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={COLORS.mediumGray} />
                    <Text style={styles.dateTimeButtonText}>
                      {newEvent.date ? newEvent.date.toLocaleDateString() : 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Time *</Text>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={16} color={COLORS.mediumGray} />
                    <Text style={styles.dateTimeButtonText}>
                      {newEvent.time ? formatTime(newEvent.time) : 'Select Time'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={newEvent.description || ''}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
                  placeholder="Additional details about this event..."
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={newEvent.location || ''}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
                  placeholder="e.g., City Animal Hospital"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEvent}
              >
                <LinearGradient
                  colors={[COLORS.lightCyan, COLORS.midCyan]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveButtonText}>Save Event</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={newEvent.date || new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={newEvent.time || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.lightCyan,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  syncSection: {
    backgroundColor: COLORS.softGray,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    fontSize: 14,
    color: COLORS.deepNavy,
    fontWeight: '500',
  },
  enableSyncButton: {
    backgroundColor: COLORS.lightCyan,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableSyncText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedEventCard: {
    backgroundColor: COLORS.softGray,
    opacity: 0.8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedEventIcon: {
    backgroundColor: COLORS.success,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 4,
  },
  completedEventTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.mediumGray,
  },
  eventDateTime: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.deepNavy,
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  syncedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  syncedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.deepNavy,
  },
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.deepNavy,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    marginBottom: 5,
  },
  typeOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  selectedTypeOption: {
    backgroundColor: 'rgba(93, 212, 220, 0.1)',
  },
  typeOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedTypeOptionIcon: {
    transform: [{ scale: 1.1 }],
  },
  typeOptionText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedTypeOptionText: {
    color: COLORS.deepNavy,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: COLORS.deepNavy,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});