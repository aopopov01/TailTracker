import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  useTheme,
  Card,
  Badge,
  Chip,
  FAB,
  ActivityIndicator,
  Button,
  Switch,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  type:
    | 'lost_pet'
    | 'vaccination'
    | 'system'
    | 'social'
    | 'emergency'
    | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  petId?: string;
  petName?: string;
  actionRequired?: boolean;
  metadata?: {
    location?: string;
    distance?: number;
    contact?: string;
    phone?: string;
  };
}

interface NotificationSettings {
  lostPetAlerts: boolean;
  vaccinationReminders: boolean;
  systemUpdates: boolean;
  socialUpdates: boolean;
  emergencyAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

type FilterType = 'all' | 'unread' | 'urgent' | 'pet_related';

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    lostPetAlerts: true,
    vaccinationReminders: true,
    systemUpdates: false,
    socialUpdates: true,
    emergencyAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showSettings, setShowSettings] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [
        pushEnabled,
        soundEnabled,
        vibrationEnabled,
        quietHoursStart,
        quietHoursEnd,
      ] = await Promise.all([
        AsyncStorage.getItem('pushNotifications'),
        AsyncStorage.getItem('notificationSound'),
        AsyncStorage.getItem('notificationVibration'),
        AsyncStorage.getItem('quietHoursStart'),
        AsyncStorage.getItem('quietHoursEnd'),
      ]);

      setSettings(prev => ({
        ...prev,
        pushNotifications: pushEnabled !== 'false',
        sound: soundEnabled !== 'false',
        vibration: vibrationEnabled !== 'false',
        quietHoursStart: quietHoursStart || '22:00',
        quietHoursEnd: quietHoursEnd || '07:00',
      }));
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  const filterNotifications = useCallback(() => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'urgent':
        filtered = notifications.filter(
          n => n.priority === 'urgent' || n.priority === 'high'
        );
        break;
      case 'pet_related':
        filtered = notifications.filter(
          n => n.type === 'lost_pet' || n.type === 'vaccination'
        );
        break;
      default:
        break;
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    filterNotifications();
  }, [filterNotifications]);

  const loadNotifications = async () => {
    try {
      // Mock notifications data - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'lost_pet',
          title: 'Lost Pet Alert',
          message:
            'A Golden Retriever named "Buddy" is missing near your area. Last seen at Golden Gate Park.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          read: false,
          priority: 'urgent',
          petName: 'Buddy',
          actionRequired: true,
          metadata: {
            location: 'Golden Gate Park',
            distance: 0.8,
          },
        },
        {
          id: '2',
          type: 'vaccination',
          title: 'Vaccination Reminder',
          message: 'Max is due for his annual rabies vaccination next week.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          priority: 'high',
          petId: '1',
          petName: 'Max',
          actionRequired: true,
          metadata: {
            contact: 'Happy Paws Veterinary',
            phone: '+1 (555) 123-4567',
          },
        },
        {
          id: '3',
          type: 'system',
          title: 'App Updated',
          message:
            'TailTracker has been updated with new features and bug fixes.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          read: true,
          priority: 'low',
          actionRequired: false,
        },
        {
          id: '4',
          type: 'social',
          title: 'Pet Photo Liked',
          message:
            'Your photo of Bella received 12 likes from other pet owners!',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          read: true,
          priority: 'low',
          petId: '2',
          petName: 'Bella',
          actionRequired: false,
        },
        {
          id: '5',
          type: 'emergency',
          title: 'Emergency Contact Alert',
          message: 'Your emergency contact tried to reach you regarding Max.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: false,
          priority: 'urgent',
          petId: '1',
          petName: 'Max',
          actionRequired: true,
          metadata: {
            contact: 'Jane Doe',
            phone: '+1 (555) 987-6543',
          },
        },
        {
          id: '6',
          type: 'reminder',
          title: 'Weekly Health Check',
          message:
            "Don't forget to check Max's weight and update his health profile.",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          read: true,
          priority: 'medium',
          petId: '1',
          petName: 'Max',
          actionRequired: false,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(
        'notificationSettings',
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Handle different notification types
    switch (notification.type) {
      case 'lost_pet':
        Alert.alert(
          'Lost Pet Alert',
          `${notification.message}\n\nWould you like to help look for this pet?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Help Search',
              onPress: () => console.log('Help search for pet'),
            },
            {
              text: 'Call Owner',
              onPress: () => console.log('Call pet owner'),
            },
          ]
        );
        break;
      case 'vaccination':
        Alert.alert('Vaccination Reminder', notification.message, [
          { text: 'Remind Later', style: 'cancel' },
          {
            text: 'Schedule Now',
            onPress: () => console.log('Schedule vaccination'),
          },
        ]);
        break;
      case 'emergency':
        Alert.alert('Emergency Alert', notification.message, [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Call Back',
            onPress: () => console.log('Call emergency contact'),
          },
        ]);
        break;
      default:
        // Just mark as read for other types
        break;
    }
  };

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'lost_pet':
        return 'paw-off';
      case 'vaccination':
        return 'medical-bag';
      case 'system':
        return 'cog';
      case 'social':
        return 'heart';
      case 'emergency':
        return 'alert';
      case 'reminder':
        return 'bell-ring';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (
    type: Notification['type'],
    priority: Notification['priority']
  ) => {
    if (priority === 'urgent') return theme.colors.error;
    if (priority === 'high') return theme.colors.primary;

    switch (type) {
      case 'lost_pet':
        return theme.colors.error;
      case 'vaccination':
        return theme.colors.tertiary;
      case 'system':
        return theme.colors.outline;
      case 'social':
        return theme.colors.secondary;
      case 'emergency':
        return theme.colors.error;
      case 'reminder':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.id)}
    >
      <Card
        style={[
          styles.notificationCard,
          { backgroundColor: theme.colors.surface },
          !item.read && {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          },
        ]}
      >
        <Card.Content>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIcon}>
              <Icon
                name={getNotificationIcon(item.type)}
                size={24}
                color={getNotificationColor(item.type, item.priority)}
              />
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.notificationTitleRow}>
                <Text
                  style={[
                    styles.notificationTitle,
                    { color: theme.colors.onSurface },
                    !item.read && { fontWeight: '600' },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View style={styles.notificationMeta}>
                  {item.priority === 'urgent' && (
                    <Badge
                      style={[
                        styles.urgentBadge,
                        { backgroundColor: theme.colors.error },
                      ]}
                    >
                      URGENT
                    </Badge>
                  )}
                  <Text
                    style={[
                      styles.timestamp,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.notificationMessage,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                numberOfLines={2}
              >
                {item.message}
              </Text>

              {item.petName && (
                <Chip
                  icon='paw'
                  style={[
                    styles.petChip,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  textStyle={{
                    color: theme.colors.onPrimaryContainer,
                    fontSize: 12,
                  }}
                >
                  {item.petName}
                </Chip>
              )}

              {item.metadata?.location && (
                <View style={styles.metadataRow}>
                  <Icon
                    name='map-marker'
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.metadataText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {item.metadata.location}
                    {item.metadata.distance &&
                      ` (${item.metadata.distance}km away)`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {item.actionRequired && (
            <View style={styles.actionButtons}>
              <Button
                mode='text'
                onPress={() => console.log('Dismiss action')}
                style={styles.actionButton}
              >
                Dismiss
              </Button>
              <Button
                mode='contained'
                onPress={() => console.log('Take action')}
                style={styles.actionButton}
              >
                {item.type === 'vaccination' ? 'Schedule' : 'Take Action'}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderSettingsPanel = () => (
    <Card
      style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}
    >
      <Card.Content>
        <Text style={[styles.settingsTitle, { color: theme.colors.onSurface }]}>
          Notification Settings
        </Text>

        <View style={styles.settingRow}>
          <Text
            style={[styles.settingLabel, { color: theme.colors.onSurface }]}
          >
            Lost Pet Alerts
          </Text>
          <Switch
            value={settings.lostPetAlerts}
            onValueChange={value =>
              saveSettings({ ...settings, lostPetAlerts: value })
            }
          />
        </View>

        <View style={styles.settingRow}>
          <Text
            style={[styles.settingLabel, { color: theme.colors.onSurface }]}
          >
            Vaccination Reminders
          </Text>
          <Switch
            value={settings.vaccinationReminders}
            onValueChange={value =>
              saveSettings({ ...settings, vaccinationReminders: value })
            }
          />
        </View>

        <View style={styles.settingRow}>
          <Text
            style={[styles.settingLabel, { color: theme.colors.onSurface }]}
          >
            System Updates
          </Text>
          <Switch
            value={settings.systemUpdates}
            onValueChange={value =>
              saveSettings({ ...settings, systemUpdates: value })
            }
          />
        </View>

        <View style={styles.settingRow}>
          <Text
            style={[styles.settingLabel, { color: theme.colors.onSurface }]}
          >
            Social Updates
          </Text>
          <Switch
            value={settings.socialUpdates}
            onValueChange={value =>
              saveSettings({ ...settings, socialUpdates: value })
            }
          />
        </View>

        <View style={styles.settingRow}>
          <Text
            style={[styles.settingLabel, { color: theme.colors.onSurface }]}
          >
            Emergency Alerts
          </Text>
          <Switch
            value={settings.emergencyAlerts}
            onValueChange={value =>
              saveSettings({ ...settings, emergencyAlerts: value })
            }
          />
        </View>

        <Divider style={styles.divider} />

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() =>
            Alert.alert('Quiet Hours', 'Quiet hours feature coming soon!')
          }
        >
          <View>
            <Text
              style={[styles.settingLabel, { color: theme.colors.onSurface }]}
            >
              Quiet Hours
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {settings.quietHours.enabled
                ? `${settings.quietHours.start} - ${settings.quietHours.end}`
                : 'Disabled'}
            </Text>
          </View>
          <Icon
            name='chevron-right'
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size='large' />
          <Text
            style={[styles.loadingText, { color: theme.colors.onBackground }]}
          >
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Badge
              style={[
                styles.unreadBadge,
                { backgroundColor: theme.colors.error },
              ]}
            >
              {unreadCount}
            </Badge>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Icon name='cog' size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={markAllAsRead}
            >
              <Icon
                name='email-open-multiple'
                size={24}
                color={theme.colors.onSurface}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {(['all', 'unread', 'urgent', 'pet_related'] as FilterType[]).map(
          filterType => (
            <Chip
              key={filterType}
              selected={filter === filterType}
              onPress={() => setFilter(filterType)}
              style={styles.filterChip}
            >
              {filterType === 'pet_related'
                ? 'Pet Related'
                : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' &&
                unreadCount > 0 &&
                ` (${unreadCount})`}
            </Chip>
          )
        )}
      </View>

      {/* Settings Panel */}
      {showSettings && renderSettingsPanel()}

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon
            name={filter === 'all' ? 'bell-off' : 'bell-outline'}
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {filter === 'all'
              ? 'No notifications yet'
              : `No ${filter} notifications`}
          </Text>
          {filter !== 'all' && (
            <Button mode='text' onPress={() => setFilter('all')}>
              Show all notifications
            </Button>
          )}
        </View>
      )}

      {/* Test Notification FAB */}
      <FAB
        icon='bell-plus'
        style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
        onPress={() => {
          // Add a test notification
          const testNotification: Notification = {
            id: Date.now().toString(),
            type: 'system',
            title: 'Test Notification',
            message: 'This is a test notification to demonstrate the feature.',
            timestamp: new Date(),
            read: false,
            priority: 'low',
            actionRequired: false,
          };
          setNotifications(prev => [testNotification, ...prev]);
        }}
        label='Test'
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  unreadBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    marginRight: 8,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  notificationMeta: {
    alignItems: 'flex-end',
  },
  urgentBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  petChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    height: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
