import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Switch,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';

import useLostPetNotifications from '../../hooks/useLostPetNotifications';
import usePremiumAccess from '../../hooks/usePremiumAccess';

interface LostPetNotificationSettingsProps {
  showTitle?: boolean;
}

export const LostPetNotificationSettings: React.FC<
  LostPetNotificationSettingsProps
> = ({ showTitle = true }) => {
  const { hasPremiumAccess } = usePremiumAccess();
  const {
    notificationsEnabled,
    pushToken,
    loading,
    error,
    pendingNotifications,
    enableNotifications,
    disableNotifications,
    clearNotifications,
    testNotification,
    refreshStatus,
  } = useLostPetNotifications();

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      Alert.alert(
        'Disable Lost Pet Alerts?',
        'You will no longer receive notifications when pets go missing in your area. You can re-enable this anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: disableNotifications,
          },
        ]
      );
    } else {
      await enableNotifications();
    }
  };

  const handleClearNotifications = () => {
    if (pendingNotifications.length === 0) {
      Alert.alert(
        'No Notifications',
        'You have no pending lost pet alerts to clear.'
      );
      return;
    }

    Alert.alert(
      'Clear Notifications?',
      `This will clear ${pendingNotifications.length} pending lost pet alert${pendingNotifications.length > 1 ? 's' : ''}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: clearNotifications },
      ]
    );
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This will send a test lost pet alert to your device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Test', onPress: testNotification },
      ]
    );
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (!hasPremiumAccess) return 'Premium Required';
    if (error) return 'Error';
    if (notificationsEnabled) return 'Active';
    return 'Disabled';
  };

  const getStatusColor = () => {
    if (loading) return '#999';
    if (!hasPremiumAccess) return '#FF9800';
    if (error) return '#F44336';
    if (notificationsEnabled) return '#4CAF50';
    return '#999';
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {showTitle && (
          <View style={styles.header}>
            <Text style={styles.title}>Lost Pet Alerts</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor() + '20' },
              ]}
              textStyle={{ color: getStatusColor(), fontSize: 12 }}
              compact
            >
              {getStatusText()}
            </Chip>
          </View>
        )}

        <Text style={styles.description}>
          Get notified when pets go missing in your area so you can help reunite
          them with their families.
        </Text>

        {!hasPremiumAccess && (
          <View style={styles.premiumNotice}>
            <Text style={styles.premiumText}>
              🌟 Lost pet alerts are available for all users. Premium users can
              also report their own pets as lost and send regional alerts.
            </Text>
          </View>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Regional Notifications</Text>
            <Text style={styles.settingSubtext}>
              Receive alerts for lost pets within 25km of your location
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator size='small' />
          ) : (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={loading}
            />
          )}
        </View>

        {notificationsEnabled && (
          <View style={styles.details}>
            <Divider style={styles.divider} />

            {pendingNotifications.length > 0 && (
              <View style={styles.pendingRow}>
                <Text style={styles.pendingText}>
                  📱 {pendingNotifications.length} pending alert
                  {pendingNotifications.length > 1 ? 's' : ''}
                </Text>
                <Button
                  mode='outlined'
                  compact
                  onPress={handleClearNotifications}
                  style={styles.clearButton}
                >
                  Clear
                </Button>
              </View>
            )}

            <View style={styles.tokenInfo}>
              <Text style={styles.tokenLabel}>Device Status:</Text>
              <Text style={styles.tokenValue}>
                {pushToken ? '✅ Ready to receive alerts' : '⚠️ Setup required'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                mode='outlined'
                icon='refresh'
                onPress={refreshStatus}
                style={styles.actionButton}
                compact
              >
                Refresh
              </Button>
              <Button
                mode='outlined'
                icon='test-tube'
                onPress={handleTestNotification}
                style={styles.actionButton}
                compact
              >
                Test
              </Button>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Button
              mode='outlined'
              onPress={refreshStatus}
              compact
              style={{ marginTop: 8 }}
            >
              Retry
            </Button>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Receive instant alerts when pets go missing nearby{'\n'}• Help
            reunite lost pets with their families{'\n'}• Community-powered early
            warning system{'\n'}• Privacy-focused location sharing
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumNotice: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  premiumText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  details: {
    marginTop: 16,
  },
  divider: {
    marginVertical: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  clearButton: {
    borderColor: '#FF9800',
  },
  tokenInfo: {
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  tokenValue: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default LostPetNotificationSettings;
