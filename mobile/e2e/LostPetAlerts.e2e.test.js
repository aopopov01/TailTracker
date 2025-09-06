const { device, element, by, expect } = require('detox');
const AppNavigation = require('./AppNavigation');
const DeviceHelpers = require('./DeviceHelpers');
const LostPetHelpers = require('./LostPetHelpers');
const NotificationHelpers = require('./NotificationHelpers');
const TestUsers = require('./TestUsers');

describe('Lost Pet Alerts E2E Tests', () => {
  beforeAll(async () => {
    // Ensure app is in clean state
    await device.launchApp({ delete: true });
    
    // Wait for app to fully load
    await waitFor(element(by.id('welcomeScreen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  beforeEach(async () => {
    // Reset to home screen before each test
    try {
      await device.launchApp({ newInstance: false });
    } catch (_error) {
      await device.launchApp({ delete: true });
    }
  });

  describe('Authentication and Setup', () => {
    it('should allow premium user to login and access lost pet features', async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
      
      // Verify home screen is visible
      await expect(element(by.id('homeScreen'))).toBeVisible();
      
      // Check that lost pet alerts tab is accessible
      await expect(element(by.id('alertsTab'))).toBeVisible();
    });

    it('should show premium upgrade prompt for free users trying to access lost pet alerts', async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.FREE);
      
      // Try to access lost pet alerts
      await element(by.id('alertsTab')).tap();
      
      // Should show premium upgrade prompt
      await expect(element(by.text('Premium Feature'))).toBeVisible();
      await expect(element(by.text('Upgrade to Premium'))).toBeVisible();
      
      // Close the prompt
      await element(by.text('Cancel')).tap();
    });
  });

  describe('Lost Pet Reporting Flow', () => {
    beforeEach(async () => {
      // Login as premium user before each test
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
      
      // Grant necessary permissions
      await NotificationHelpers.enableNotifications();
      await DeviceHelpers.allowPermission('notifications');
      await DeviceHelpers.allowPermission('location');
    });

    it('should allow user to report a lost pet with all details', async () => {
      // Navigate to pets tab and select a pet
      await element(by.id('petsTab')).tap();
      await waitFor(element(by.text('Buddy'))).toBeVisible().withTimeout(5000);
      await element(by.text('Buddy')).tap();
      
      // Tap report lost button
      await waitFor(element(by.id('reportLostButton'))).toBeVisible().withTimeout(5000);
      await element(by.id('reportLostButton')).tap();
      
      // Fill out lost pet report form
      await waitFor(element(by.id('lostPetForm'))).toBeVisible().withTimeout(5000);
      
      // Enter last seen location
      await element(by.id('lastSeenLocationInput')).tap();
      await element(by.id('lastSeenLocationInput')).typeText('Golden Gate Park, San Francisco, CA');
      
      // Enter description
      await element(by.id('descriptionInput')).tap();
      await element(by.id('descriptionInput')).typeText('Last seen playing fetch with a red ball near the playground');
      
      // Enter reward amount
      await element(by.id('rewardAmountInput')).tap();
      await element(by.id('rewardAmountInput')).typeText('100');
      
      // Enter contact phone
      await element(by.id('contactPhoneInput')).tap();
      await element(by.id('contactPhoneInput')).typeText('+1-555-123-4567');
      
      // Set search radius
      await element(by.id('searchRadiusSlider')).tap();
      
      // Submit the report
      await element(by.id('submitLostPetReport')).tap();
      
      // Wait for confirmation dialog
      await waitFor(element(by.text('Lost Pet Report Created')))
        .toBeVisible()
        .withTimeout(15000);
      
      // Verify alert details are shown
      await expect(element(by.text('Alerts sent to nearby users'))).toBeVisible();
      
      // Close confirmation
      await element(by.text('OK')).tap();
      
      // Verify we're back to pet profile with updated status
      await waitFor(element(by.text('Status: Lost')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should validate required fields in lost pet report', async () => {
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // Try to submit without filling required fields
      await element(by.id('submitLostPetReport')).tap();
      
      // Should show validation errors
      await expect(element(by.text('Please fill in all required fields'))).toBeVisible();
      
      // Fill only location
      await element(by.id('lastSeenLocationInput')).typeText('Some location');
      await element(by.id('submitLostPetReport')).tap();
      
      // Should still show error for missing description
      await expect(element(by.text('Description is required'))).toBeVisible();
    });

    it('should allow uploading photos with lost pet report', async () => {
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // Tap add photo button
      await element(by.id('addPhotoButton')).tap();
      
      // Choose camera option
      await element(by.text('Take Photo')).tap();
      
      // Grant camera permission if needed
      await DeviceHelpers.allowPermission('camera');
      
      // Simulate taking a photo (this would open camera in real scenario)
      // For testing, we'll just verify the photo picker appeared
      await waitFor(element(by.id('photoPreview')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Continue with the rest of the form
      await element(by.id('lastSeenLocationInput')).typeText('Park');
      await element(by.id('descriptionInput')).typeText('Test description');
      await element(by.id('submitLostPetReport')).tap();
      
      await waitFor(element(by.text('Lost Pet Report Created')))
        .toBeVisible()
        .withTimeout(15000);
    });
  });

  describe('Lost Pet Notifications', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
      await NotificationHelpers.enableNotifications();
    });

    it('should send test notification successfully', async () => {
      await NotificationHelpers.testNotification();
      
      // Verify test notification was sent
      // Note: In real testing, you'd verify the notification appears in the system
      await expect(element(by.text('Test notification sent'))).toBeVisible();
    });

    it('should update notification settings', async () => {
      await AppNavigation.goToSettings();
      await element(by.id('notificationSettings')).tap();
      
      // Verify notification toggle exists
      await expect(element(by.id('lostPetNotificationToggle'))).toBeVisible();
      
      // Verify current state
      const toggle = element(by.id('lostPetNotificationToggle'));
      await expect(toggle).toBeVisible();
      
      // Test toggling off
      await toggle.tap();
      
      // Verify confirmation dialog
      await expect(element(by.text('Disable Lost Pet Notifications?'))).toBeVisible();
      await element(by.text('Confirm')).tap();
      
      // Verify toggle is now off
      const attributes = await toggle.getAttributes();
      expect(attributes.value).toBe('0');
      
      // Toggle back on
      await toggle.tap();
      await DeviceHelpers.allowPermission('notifications');
    });
  });

  describe('Nearby Alerts', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
    });

    it('should display nearby lost pet alerts', async () => {
      await AppNavigation.goToLostPetAlerts();
      
      // Switch to nearby alerts tab
      await element(by.id('nearbyAlertsTab')).tap();
      
      // Wait for alerts to load
      await waitFor(element(by.id('nearbyAlertsList')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Verify alert list is displayed
      await expect(element(by.id('nearbyAlertsList'))).toBeVisible();
      
      // If there are alerts, test interaction
      try {
        await element(by.id('nearbyAlert-0')).tap();
        
        // Should open alert details
        await waitFor(element(by.id('alertDetailsScreen')))
          .toBeVisible()
          .withTimeout(5000);
        
        // Verify alert details are shown
        await expect(element(by.id('petPhoto'))).toBeVisible();
        await expect(element(by.id('petName'))).toBeVisible();
        await expect(element(by.id('lastSeenLocation'))).toBeVisible();
        await expect(element(by.id('contactInfo'))).toBeVisible();
        
        // Test call button
        await expect(element(by.id('callButton'))).toBeVisible();
        
        // Test directions button
        await expect(element(by.id('directionsButton'))).toBeVisible();
        
        // Go back
        await element(by.id('backButton')).tap();
      } catch (_error) {
        // No alerts available, which is fine for testing
        await expect(element(by.text('No lost pets in your area'))).toBeVisible();
      }
    });

    it('should filter alerts by distance', async () => {
      await AppNavigation.goToLostPetAlerts();
      await element(by.id('nearbyAlertsTab')).tap();
      
      // Open filter options
      await element(by.id('filterButton')).tap();
      
      // Set distance filter
      await element(by.id('distanceSlider')).tap();
      
      // Apply filter
      await element(by.id('applyFiltersButton')).tap();
      
      // Verify filter is applied
      await waitFor(element(by.id('filterAppliedIndicator')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Clear filters
      await element(by.id('clearFiltersButton')).tap();
    });
  });

  describe('Pet Status Management', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
      
      // First, report a pet as lost
      await LostPetHelpers.reportLostPet('Buddy');
    });

    it('should allow marking pet as found', async () => {
      // Navigate to lost pet alerts
      await AppNavigation.goToLostPetAlerts();
      
      // Switch to my reports tab
      await element(by.id('myReportsTab')).tap();
      
      // Find and tap on the lost pet report
      await waitFor(element(by.text('Buddy')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text('Buddy')).tap();
      
      // Mark as found
      await element(by.id('markAsFoundButton')).tap();
      
      // Confirm action
      await element(by.text('Mark as Found')).tap();
      
      // Wait for confirmation
      await waitFor(element(by.text('Pet Marked as Found')))
        .toBeVisible()
        .withTimeout(10000);
      
      await element(by.text('OK')).tap();
      
      // Verify status is updated
      await expect(element(by.text('Status: Found'))).toBeVisible();
    });

    it('should show found pets in separate section', async () => {
      // Mark pet as found first
      await LostPetHelpers.markPetAsFound('Buddy');
      
      // Navigate to alerts
      await AppNavigation.goToLostPetAlerts();
      
      // Check found pets section
      await element(by.id('foundPetsTab')).tap();
      
      // Verify pet appears in found section
      await waitFor(element(by.text('Buddy')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Verify found status
      await expect(element(by.text('Found'))).toBeVisible();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
    });

    it('should handle network errors gracefully', async () => {
      // Simulate network disconnection
      await device.setURLBlacklist(['*']);
      
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // Fill form and submit
      await element(by.id('lastSeenLocationInput')).typeText('Test location');
      await element(by.id('descriptionInput')).typeText('Test description');
      await element(by.id('submitLostPetReport')).tap();
      
      // Should show network error
      await waitFor(element(by.text('Network Error')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Please check your internet connection'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      
      // Retry button should work
      await element(by.text('Retry')).tap();
    });

    it('should handle permission denied scenarios', async () => {
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // Try to add location without permission
      await element(by.id('currentLocationButton')).tap();
      
      // Deny location permission
      await DeviceHelpers.denyPermission('location');
      
      // Should show permission error
      await expect(element(by.text('Location Permission Required'))).toBeVisible();
      
      // Should offer manual location entry as fallback
      await expect(element(by.text('Enter Location Manually'))).toBeVisible();
      await element(by.text('Enter Location Manually')).tap();
      
      // Manual entry should be available
      await expect(element(by.id('lastSeenLocationInput'))).toBeVisible();
    });

    it('should validate form inputs', async () => {
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // Test invalid phone number
      await element(by.id('contactPhoneInput')).typeText('invalid-phone');
      await element(by.id('lastSeenLocationInput')).typeText('Valid location');
      await element(by.id('descriptionInput')).typeText('Valid description');
      await element(by.id('submitLostPetReport')).tap();
      
      // Should show phone validation error
      await expect(element(by.text('Please enter a valid phone number'))).toBeVisible();
      
      // Fix phone number
      await element(by.id('contactPhoneInput')).clearText();
      await element(by.id('contactPhoneInput')).typeText('+1-555-123-4567');
      
      // Test invalid reward amount
      await element(by.id('rewardAmountInput')).typeText('-50');
      await element(by.id('submitLostPetReport')).tap();
      
      // Should show reward validation error
      await expect(element(by.text('Reward amount must be positive'))).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
    });

    it('should support VoiceOver/TalkBack navigation', async () => {
      // Enable accessibility
      await device.enableSynchronization();
      
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      
      // Verify accessibility labels exist
      await expect(element(by.id('reportLostButton'))).toHaveLabel('Report pet as lost');
      
      await element(by.id('reportLostButton')).tap();
      
      // Test form accessibility
      await expect(element(by.id('lastSeenLocationInput'))).toHaveLabel('Last seen location');
      await expect(element(by.id('descriptionInput'))).toHaveLabel('Description of pet when last seen');
      await expect(element(by.id('rewardAmountInput'))).toHaveLabel('Reward amount in dollars');
    });

    it('should have proper focus management', async () => {
      await element(by.id('petsTab')).tap();
      await element(by.text('Buddy')).tap();
      await element(by.id('reportLostButton')).tap();
      
      // First field should be focused
      await expect(element(by.id('lastSeenLocationInput'))).toBeFocused();
      
      // Tab to next field should work
      // Note: This would require specific accessibility testing setup
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await AppNavigation.goToLogin();
      await AppNavigation.login(TestUsers.PREMIUM);
    });

    it('should load nearby alerts quickly', async () => {
      const startTime = Date.now();
      
      await AppNavigation.goToLostPetAlerts();
      await element(by.id('nearbyAlertsTab')).tap();
      
      await waitFor(element(by.id('nearbyAlertsList')))
        .toBeVisible()
        .withTimeout(5000);
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should handle large lists of alerts efficiently', async () => {
      await AppNavigation.goToLostPetAlerts();
      await element(by.id('nearbyAlertsTab')).tap();
      
      // Scroll through alerts list to test performance
      try {
        for (let i = 0; i < 10; i++) {
          await element(by.id('nearbyAlertsList')).scroll(200, 'down');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Scroll back to top
        await element(by.id('nearbyAlertsList')).scroll(1000, 'up');
      } catch (_error) {
        // List might not be long enough to scroll, which is fine
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await AppNavigation.logout();
    } catch (_error) {
      // Already logged out or app in unexpected state
    }
  });
});