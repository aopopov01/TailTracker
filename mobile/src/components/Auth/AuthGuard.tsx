import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { MigrationService } from '../../services/migrationService';
import { log } from '../../utils/Logger';
import { AuthNavigator } from './AuthNavigator';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState(false);

  useEffect(() => {
    const checkMigration = async () => {
      try {
        setMigrationInProgress(true);
        
        // Check if migration is needed
        const migrationNeeded = await MigrationService.checkMigrationNeeded();
        
        if (migrationNeeded && !isAuthenticated) {
          // Show migration flow to user
          await MigrationService.handleMigrationFlow();
        }
        
        setMigrationChecked(true);
      } catch (error) {
        log.error('Migration check error:', error);
        setMigrationChecked(true);
      } finally {
        setMigrationInProgress(false);
      }
    };

    if (!isLoading && !migrationChecked) {
      checkMigration();
    }
  }, [isLoading, isAuthenticated, migrationChecked]);

  // Perform post-auth migration if needed
  useEffect(() => {
    const performPostAuthMigration = async () => {
      if (isAuthenticated && migrationChecked) {
        try {
          await MigrationService.performPostAuthMigration();
        } catch (error) {
          log.error('Post-auth migration error:', error);
        }
      }
    };

    performPostAuthMigration();
  }, [isAuthenticated, migrationChecked]);

  const handleAuthSuccess = () => {
    // This will be called after successful login/registration
    // The useEffect above will handle post-auth migration
  };

  // Show loading spinner while checking authentication or migration
  if (isLoading || migrationInProgress || !migrationChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>
          {migrationInProgress ? 'Checking for data migration...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return <AuthNavigator onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main app if authenticated
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});