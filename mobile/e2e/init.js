const detox = require('detox');
const config = require('../.detoxrc.json');
const adapter = require('detox/runners/jest/adapter');

// Set the default timeout for all tests
jest.setTimeout(120000);

// Initialize Detox before all tests
beforeAll(async () => {
  await detox.init(config, {
    initGlobals: false,
  });
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      location: 'always',
      photos: 'YES',
      microphone: 'YES',
    },
    launchArgs: {
      detoxEnableSynchronization: 0,
    },
    delete: false, // Don't delete app data between tests
  });
});

// Clean up after all tests
beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

// Global test helpers
global.waitForElementToBeVisible = async (element, timeout = 10000) => {
  await waitFor(element).toBeVisible().withTimeout(timeout);
};

global.waitForElementToExist = async (element, timeout = 10000) => {
  await waitFor(element).toExist().withTimeout(timeout);
};

global.scrollToElement = async (element, direction = 'down') => {
  await waitFor(element)
    .toBeVisible()
    .whileElement(by.id('scrollView'))
    .scroll(200, direction);
};

// Test data helpers
global.TestUsers = {
  PREMIUM: {
    email: 'premium@tailtracker.com',
    password: 'testpass123',
    subscription: 'premium',
  },
  FREE: {
    email: 'free@tailtracker.com',
    password: 'testpass123',
    subscription: 'free',
  },
  FAMILY: {
    email: 'family@tailtracker.com',
    password: 'testpass123',
    subscription: 'family',
  },
};

global.TestPets = {
  DOG: {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30,
  },
  CAT: {
    name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    age: 2,
    weight: 8,
  },
};

// App navigation helpers
global.AppNavigation = {
  async goToLogin() {
    await element(by.id('welcomeScreen')).tap();
    await element(by.id('loginButton')).tap();
  },

  async login(user = TestUsers.PREMIUM) {
    await element(by.id('emailInput')).typeText(user.email);
    await element(by.id('passwordInput')).typeText(user.password);
    await element(by.id('loginSubmitButton')).tap();
    
    // Wait for login to complete
    await waitFor(element(by.id('homeScreen')))
      .toBeVisible()
      .withTimeout(15000);
  },

  async logout() {
    await element(by.id('profileTab')).tap();
    await element(by.id('logoutButton')).tap();
    await element(by.text('Logout')).tap(); // Confirm logout
  },

  async goToPetProfile(petName = 'Buddy') {
    await element(by.id('petsTab')).tap();
    await element(by.text(petName)).tap();
  },

  async goToLostPetAlerts() {
    await element(by.id('alertsTab')).tap();
  },

  async goToSettings() {
    await element(by.id('profileTab')).tap();
    await element(by.id('settingsButton')).tap();
  },
};

// Lost pet testing helpers
global.LostPetHelpers = {
  async reportLostPet(petName = 'Buddy') {
    // Navigate to pet profile
    await AppNavigation.goToPetProfile(petName);
    
    // Tap report lost button
    await element(by.id('reportLostButton')).tap();
    
    // Fill in lost pet form
    await element(by.id('lastSeenLocationInput')).typeText('Golden Gate Park, SF');
    await element(by.id('descriptionInput')).typeText('Last seen playing fetch');
    await element(by.id('rewardAmountInput')).typeText('100');
    await element(by.id('contactPhoneInput')).typeText('+1234567890');
    
    // Submit report
    await element(by.id('submitLostPetReport')).tap();
    
    // Wait for confirmation
    await waitFor(element(by.text('Lost Pet Report Created')))
      .toBeVisible()
      .withTimeout(10000);
    
    await element(by.text('OK')).tap();
  },

  async markPetAsFound(petName = 'Buddy') {
    // Navigate to alerts
    await AppNavigation.goToLostPetAlerts();
    
    // Find the lost pet report
    await element(by.text(petName)).tap();
    
    // Mark as found
    await element(by.id('markAsFoundButton')).tap();
    await element(by.text('Mark as Found')).tap(); // Confirm
    
    // Wait for confirmation
    await waitFor(element(by.text('Pet Marked as Found')))
      .toBeVisible()
      .withTimeout(5000);
  },

  async viewNearbyAlerts() {
    await AppNavigation.goToLostPetAlerts();
    await element(by.id('nearbyAlertsTab')).tap();
    
    // Wait for alerts to load
    await waitFor(element(by.id('nearbyAlertsList')))
      .toBeVisible()
      .withTimeout(10000);
  },
};

// Notification testing helpers
global.NotificationHelpers = {
  async enableNotifications() {
    await AppNavigation.goToSettings();
    await element(by.id('notificationSettings')).tap();
    
    // Enable lost pet notifications
    const notificationToggle = element(by.id('lostPetNotificationToggle'));
    const attributes = await notificationToggle.getAttributes();
    
    if (attributes.value === '0') {
      await notificationToggle.tap();
    }
    
    // Grant permissions if prompted
    try {
      await element(by.text('Allow')).tap();
    } catch (error) {
      // Permission might already be granted
    }
  },

  async disableNotifications() {
    await AppNavigation.goToSettings();
    await element(by.id('notificationSettings')).tap();
    
    const notificationToggle = element(by.id('lostPetNotificationToggle'));
    const attributes = await notificationToggle.getAttributes();
    
    if (attributes.value === '1') {
      await notificationToggle.tap();
    }
  },

  async testNotification() {
    await AppNavigation.goToSettings();
    await element(by.id('notificationSettings')).tap();
    await element(by.id('testNotificationButton')).tap();
    
    // Wait a moment for notification to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
  },
};

// Device interaction helpers
global.DeviceHelpers = {
  async allowPermission(permissionType) {
    try {
      if (device.getPlatform() === 'ios') {
        await element(by.text('Allow')).tap();
      } else {
        await element(by.text('ALLOW')).tap();
      }
    } catch (error) {
      // Permission dialog might not appear if already granted
      console.log(`Permission dialog not found for ${permissionType}`);
    }
  },

  async denyPermission(permissionType) {
    try {
      if (device.getPlatform() === 'ios') {
        await element(by.text('Don\'t Allow')).tap();
      } else {
        await element(by.text('DENY')).tap();
      }
    } catch (error) {
      console.log(`Permission dialog not found for ${permissionType}`);
    }
  },

  async openAppSettings() {
    await device.openURL({ url: 'app-settings:' });
  },

  async simulateBackground() {
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await device.launchApp({ newInstance: false });
  },

  async simulateMemoryWarning() {
    await device.pressBack(); // Android specific
  },
};

// Assertion helpers
global.AssertionHelpers = {
  async expectElementToBeVisible(testID, timeout = 5000) {
    await expect(element(by.id(testID))).toBeVisible();
  },

  async expectElementToExist(testID, timeout = 5000) {
    await expect(element(by.id(testID))).toExist();
  },

  async expectElementToHaveText(testID, expectedText) {
    await expect(element(by.id(testID))).toHaveText(expectedText);
  },

  async expectAlertToBePresent(alertTitle) {
    if (device.getPlatform() === 'ios') {
      await expect(element(by.text(alertTitle))).toBeVisible();
    } else {
      await expect(element(by.text(alertTitle))).toExist();
    }
  },
};