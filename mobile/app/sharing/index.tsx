import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import QRCodeGenerator from '../../src/components/Sharing/QRCodeGenerator';
import QRCodeScanner from '../../src/components/Sharing/QRCodeScanner';
import SharingManager from '../../src/components/Sharing/SharingManager';
import { TailTrackerModal } from '../../src/components/UI/TailTrackerModal';
import { useAuth } from '../../src/contexts/AuthContext';

type SharingScreenType = 'main' | 'generate' | 'scan' | 'manage';

const SharingScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<SharingScreenType>('main');
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    actions?: {
      text: string;
      style?: 'default' | 'destructive' | 'primary';
      onPress: () => void;
    }[];
    icon?: keyof typeof Ionicons.glyphMap;
  }>({
    visible: false,
    title: '',
    actions: []
  });

  const showModal = useCallback((config: typeof modalConfig) => {
    setModalConfig({ ...config, visible: true });
  }, []);

  const hideModal = useCallback(() => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle authentication check in useEffect to prevent infinite re-renders
  useEffect(() => {
    if (!user) {
      showModal({
        visible: true,
        title: 'Authentication Required',
        message: 'Please log in to use sharing features.',
        type: 'warning',
        icon: 'lock-closed',
        actions: [{ text: 'Go Back', style: 'primary', onPress: () => { hideModal(); router.back(); } }]
      });
    }
  }, [user, showModal, hideModal]);

  if (!user) {
    return null;
  }

  const handleAccessGranted = () => {
    showModal({
      visible: true,
      title: 'Access Granted!',
      message: 'You now have access to shared pet information.',
      type: 'success',
      icon: 'checkmark-circle',
      actions: [
        {
          text: 'View Shared Pets',
          style: 'primary',
          onPress: () => {
            hideModal();
            router.push('/sharing/shared-pets' as any);
          }
        },
        {
          text: 'OK',
          style: 'default',
          onPress: hideModal
        }
      ]
    });
    setCurrentScreen('main');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'generate':
        return (
          <QRCodeGenerator 
            onClose={() => setCurrentScreen('main')}
            expirationHours={24}
          />
        );
      case 'scan':
        return (
          <QRCodeScanner 
            onClose={() => setCurrentScreen('main')}
            onAccessGranted={handleAccessGranted}
          />
        );
      case 'manage':
        return (
          <SharingManager 
            onClose={() => setCurrentScreen('main')}
            onGenerateNew={() => setCurrentScreen('generate')}
          />
        );
      default:
        return (
          <MainSharingScreen 
            onNavigate={setCurrentScreen}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderCurrentScreen()}
      <TailTrackerModal
        visible={modalConfig.visible}
        onClose={hideModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        actions={modalConfig.actions}
        icon={modalConfig.icon}
      />
    </SafeAreaView>
  );
};

interface MainSharingScreenProps {
  onNavigate: (screen: SharingScreenType) => void;
}

const MainSharingScreen: React.FC<MainSharingScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Pet Sharing</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.introContainer}>
          <Ionicons name="paw" size={64} color="#007AFF" />
          <Text style={styles.introTitle}>Share Your Pet Information</Text>
          <Text style={styles.introText}>
            Securely share your pet's information with family, friends, or veterinarians 
            using QR codes or sharing links.
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onNavigate('generate')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="qr-code" size={32} color="#007AFF" />
            </View>
            <Text style={styles.actionTitle}>Generate QR Code</Text>
            <Text style={styles.actionDescription}>
              Create a secure QR code that others can scan to access your pet information
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onNavigate('scan')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="scan" size={32} color="#34C759" />
            </View>
            <Text style={styles.actionTitle}>Scan QR Code</Text>
            <Text style={styles.actionDescription}>
              Scan someone else's QR code to access their pet information
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/sharing/shared-pets' as any)}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="eye" size={32} color="#FF9500" />
            </View>
            <Text style={styles.actionTitle}>View Shared Pets</Text>
            <Text style={styles.actionDescription}>
              View pet information that has been shared with you
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onNavigate('manage')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="settings" size={32} color="#8E8E93" />
            </View>
            <Text style={styles.actionTitle}>Manage Sharing</Text>
            <Text style={styles.actionDescription}>
              View and revoke active sharing codes and user access
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield" size={20} color="#FF9500" />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityTitle}>Security & Privacy</Text>
            <Text style={styles.securityText}>
              • Sharing codes expire automatically after 24 hours
            </Text>
            <Text style={styles.securityText}>
              • Shared access is read-only - others cannot modify your pet information
            </Text>
            <Text style={styles.securityText}>
              • You can revoke access at any time
            </Text>
            <Text style={styles.securityText}>
              • Only share with people you trust
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  introContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    flex: 2,
    marginRight: 12,
  },
  securityNotice: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    flexDirection: 'row',
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default SharingScreen;