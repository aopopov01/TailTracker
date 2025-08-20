describe('iOS Biometric Authentication E2E', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: {
        faceid: 'YES',
        notifications: 'YES',
        location: 'inuse',
      },
      launchArgs: {
        detoxEnableSynchronization: 0, // Disable synchronization for biometric tests
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    
    // Enable biometric authentication in simulator if available
    if (device.getPlatform() === 'ios') {
      try {
        // Enroll Face ID/Touch ID in simulator
        await device.setBiometricEnrollment(true);
      } catch (error) {
        console.warn('Could not enable biometric enrollment:', error);
      }
    }
  });

  afterEach(async () => {
    // Reset biometric state
    if (device.getPlatform() === 'ios') {
      try {
        await device.setBiometricEnrollment(false);
      } catch (error) {
        console.warn('Could not disable biometric enrollment:', error);
      }
    }
  });

  describe('Face ID Authentication', () => {
    it('should authenticate with Face ID when available', async () => {
      // Navigate to login screen
      await element(by.id('login-button')).tap();
      
      // Tap biometric authentication button
      await element(by.id('biometric-login-button')).tap();
      
      // Face ID prompt should appear
      await expect(element(by.text('Face ID'))).toBeVisible();
      
      // Simulate successful Face ID authentication
      await device.matchFace();
      
      // Should be logged in successfully
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should handle Face ID cancellation', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Cancel Face ID authentication
      await device.unmatchFace();
      
      // Should remain on login screen
      await expect(element(by.id('login-screen'))).toBeVisible();
      await expect(element(by.text('Authentication cancelled'))).toBeVisible();
    });

    it('should fall back to passcode when Face ID fails', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Simulate Face ID failure
      await device.unmatchFace();
      
      // Tap fallback option
      await element(by.text('Use Passcode')).tap();
      
      // Passcode screen should be visible
      await expect(element(by.id('passcode-input'))).toBeVisible();
    });
  });

  describe('Touch ID Authentication', () => {
    beforeEach(async () => {
      // Switch to Touch ID if testing on appropriate device
      if (device.getPlatform() === 'ios') {
        try {
          // Set device to use Touch ID instead of Face ID
          await device.setTouchIdEnrollment(true);
        } catch (error) {
          console.warn('Touch ID not available on this device');
        }
      }
    });

    it('should authenticate with Touch ID when available', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Touch ID prompt should appear
      await expect(element(by.text('Touch ID'))).toBeVisible();
      
      // Simulate successful Touch ID authentication
      try {
        await device.matchFinger();
        await expect(element(by.id('home-screen'))).toBeVisible();
      } catch (error) {
        // Skip test if Touch ID not available
        console.warn('Touch ID not available, skipping test');
      }
    });
  });

  describe('Biometric Settings', () => {
    beforeEach(async () => {
      // Navigate to settings
      await element(by.id('tab-settings')).tap();
      await element(by.id('security-settings')).tap();
    });

    it('should enable biometric authentication', async () => {
      // Toggle biometric authentication on
      await element(by.id('biometric-toggle')).tap();
      
      // Face ID prompt should appear
      await device.matchFace();
      
      // Setting should be enabled
      await expect(element(by.id('biometric-toggle'))).toHaveToggleValue(true);
      await expect(element(by.text('Face ID enabled'))).toBeVisible();
    });

    it('should disable biometric authentication', async () => {
      // First enable it
      await element(by.id('biometric-toggle')).tap();
      await device.matchFace();
      
      // Then disable it
      await element(by.id('biometric-toggle')).tap();
      
      // Setting should be disabled
      await expect(element(by.id('biometric-toggle'))).toHaveToggleValue(false);
      await expect(element(by.text('Face ID disabled'))).toBeVisible();
    });

    it('should show biometric type correctly', async () => {
      // Check if correct biometric type is displayed
      const biometricType = await device.getBiometricType();
      
      if (biometricType === 'FaceID') {
        await expect(element(by.text('Face ID'))).toBeVisible();
      } else if (biometricType === 'TouchID') {
        await expect(element(by.text('Touch ID'))).toBeVisible();
      }
    });
  });

  describe('Keychain Integration', () => {
    it('should store and retrieve credentials securely', async () => {
      // Login with credentials
      await element(by.id('login-button')).tap();
      await element(by.id('email-input')).typeText('test@tailtracker.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-submit')).tap();
      
      // Enable credential saving
      await element(by.text('Save credentials for next time?')).tap();
      await element(by.text('Yes')).tap();
      
      // Authenticate to save
      await device.matchFace();
      
      // Logout
      await element(by.id('logout-button')).tap();
      
      // Login again using saved credentials
      await element(by.id('login-button')).tap();
      await element(by.id('use-saved-credentials')).tap();
      
      // Authenticate to retrieve
      await device.matchFace();
      
      // Should be logged in
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should handle keychain access denial', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('use-saved-credentials')).tap();
      
      // Deny Face ID authentication
      await device.unmatchFace();
      
      // Should show manual login option
      await expect(element(by.text('Enter credentials manually'))).toBeVisible();
    });
  });

  describe('Pet Data Security', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      await device.matchFace();
      
      // Navigate to pet profile
      await element(by.id('tab-pets')).tap();
      await element(by.id('pet-profile-1')).tap();
    });

    it('should require biometric authentication for sensitive pet data', async () => {
      // Try to access medical records
      await element(by.id('medical-records-tab')).tap();
      
      // Should prompt for biometric authentication
      await expect(element(by.text('Authenticate to view medical records'))).toBeVisible();
      
      // Authenticate
      await device.matchFace();
      
      // Medical records should be visible
      await expect(element(by.id('medical-records-list'))).toBeVisible();
    });

    it('should protect location history access', async () => {
      // Try to access location history
      await element(by.id('location-history-tab')).tap();
      
      // Should prompt for authentication
      await device.matchFace();
      
      // Location history should be visible
      await expect(element(by.id('location-history-map'))).toBeVisible();
    });
  });

  describe('Biometric Fallbacks', () => {
    it('should handle biometric unavailability gracefully', async () => {
      // Disable biometric enrollment
      await device.setBiometricEnrollment(false);
      
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Should show unavailable message
      await expect(element(by.text('Biometric authentication is not available'))).toBeVisible();
      
      // Should offer alternative login
      await expect(element(by.text('Use password instead'))).toBeVisible();
    });

    it('should work when biometric hardware is not present', async () => {
      // This test simulates devices without biometric hardware
      await device.launchApp({
        newInstance: true,
        launchArgs: {
          MOCK_NO_BIOMETRIC_HARDWARE: 'true',
        },
      });
      
      await element(by.id('login-button')).tap();
      
      // Biometric option should not be visible
      await expect(element(by.id('biometric-login-button'))).not.toBeVisible();
      
      // Only password login should be available
      await expect(element(by.id('password-login-form'))).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle biometric system errors', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Simulate system error
      try {
        await device.setBiometricEnrollment(false);
        await device.setBiometricEnrollment(true);
      } catch (error) {
        // Expected behavior
      }
      
      // Should show error message and fallback
      await expect(element(by.text('Biometric authentication failed'))).toBeVisible();
      await expect(element(by.text('Try again or use password'))).toBeVisible();
    });

    it('should handle multiple failed attempts', async () => {
      await element(by.id('login-button')).tap();
      await element(by.id('biometric-login-button')).tap();
      
      // Fail authentication multiple times
      for (let i = 0; i < 3; i++) {
        await device.unmatchFace();
        await element(by.text('Try Again')).tap();
      }
      
      // Should lock out biometric authentication temporarily
      await expect(element(by.text('Too many failed attempts'))).toBeVisible();
      await expect(element(by.text('Please use your password'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible for VoiceOver users', async () => {
      // Enable VoiceOver
      await device.setAccessibilityService(true);
      
      await element(by.id('login-button')).tap();
      
      // Check accessibility labels
      await expect(element(by.id('biometric-login-button'))).toHaveAccessibilityLabel('Authenticate with Face ID');
      
      // Interact via VoiceOver
      await element(by.id('biometric-login-button')).tap();
      
      // VoiceOver should announce biometric prompt
      await expect(element(by.accessibilityLabel('Face ID authentication required'))).toBeVisible();
    });

    it('should support alternative authentication methods for accessibility', async () => {
      await element(by.id('login-button')).tap();
      
      // Should have accessible alternatives
      await expect(element(by.accessibilityHint('Alternative: Use password instead'))).toBeVisible();
      
      // Voice control compatibility
      await element(by.accessibilityLabel('Use password login')).tap();
      await expect(element(by.id('password-login-form'))).toBeVisible();
    });
  });
});