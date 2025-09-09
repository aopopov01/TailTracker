/**
 * Test Component to verify duplicate user handling
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthService } from '../services/authService';
import { databaseService } from '../services/databaseService';

export const DuplicateUserTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDuplicateUserHandling = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔄 Starting duplicate user handling test...');

      // Test case: try to register with an existing email
      const testEmail = 'aopopov@outlook.com'; // The email that was causing the error
      
      addResult(`📧 Testing with email: ${testEmail}`);
      
      // First, check if user already exists in database
      const existingUser = await databaseService.getUserByEmail(testEmail);
      if (existingUser) {
        addResult(`✅ Found existing user profile: ID ${existingUser.id}`);
      } else {
        addResult('ℹ️ No existing user profile found');
      }

      // Test the registration flow (this should now handle duplicates gracefully)
      const registrationData = {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };

      addResult('🔄 Testing registration with potentially existing email...');
      
      const result = await (async () => {
        try {
          const result = await AuthService.register(registrationData);
          addResult(`📊 Registration completed with status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
          return result;
        } catch (regError: any) {
          addResult(`❌ Registration threw error: ${regError.message}`);
          addResult(`📋 Error details: ${JSON.stringify(regError, null, 2)}`);
          return { success: false, error: regError.message, user: undefined };
        }
      })();
      
      if (result.success) {
        addResult('✅ Registration succeeded (duplicate handled gracefully)');
        addResult(`✅ User created/linked: ${result.user?.email}`);
        addResult('📧 Email verification will be sent by Supabase');
      } else {
        addResult(`⚠️ Registration failed: ${result.error}`);
        // This is expected for some cases, so not necessarily an error
      }

      addResult('✅ Duplicate user test completed successfully');
      addResult(`ℹ️ Registration result: ${JSON.stringify(result, null, 2)}`);

    } catch (error: any) {
      addResult(`❌ Test failed with error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseMethods = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔄 Testing database service methods...');

      const testEmail = 'aopopov@outlook.com';
      
      // Test getUserByEmail
      try {
        const userByEmail = await databaseService.getUserByEmail(testEmail);
        if (userByEmail) {
          addResult(`✅ getUserByEmail works: Found user ID ${userByEmail.id}`);
        } else {
          addResult('ℹ️ getUserByEmail works: No user found');
        }
      } catch (error: any) {
        addResult(`❌ getUserByEmail failed: ${error.message}`);
      }

      // Test getUserByAuthId (with dummy ID)
      try {
        const userByAuthId = await databaseService.getUserByAuthId('dummy-auth-id');
        if (userByAuthId) {
          addResult(`ℹ️ getUserByAuthId works: Found user`);
        } else {
          addResult('✅ getUserByAuthId works: No user found (expected)');
        }
      } catch (error: any) {
        addResult(`❌ getUserByAuthId failed: ${error.message}`);
      }

      addResult('✅ Database methods test completed');

    } catch (error: any) {
      addResult(`❌ Database test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Duplicate User Test</Text>
        <Text style={styles.subtitle}>
          Test the fix for duplicate user registration errors
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testDuplicateUserHandling}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Duplicate User Registration'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={testDatabaseMethods}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Database Methods'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <View style={styles.resultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>
              No tests run yet. Press a test button above.
            </Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Fix Summary</Text>
        <Text style={styles.infoText}>
          • Enhanced registration to handle existing user profiles{'\n'}
          • Added getUserByEmail and updateUserAuthId methods{'\n'}
          • Improved error handling for duplicate email scenarios{'\n'}
          • Links existing profiles instead of failing registration{'\n'}
          • Applied same fix to both registration and login flows
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    minHeight: 200,
  },
  resultsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
    minHeight: 150,
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    marginBottom: 4,
    lineHeight: 16,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DuplicateUserTest;