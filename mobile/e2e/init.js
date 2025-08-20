const { device, element, by, waitFor } = require('detox');

// Global test configuration
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

// Global test helpers
global.TestHelpers = {
  /**
   * Wait for element to be visible with timeout
   */
  async waitForElementToBeVisible(elementMatcher, timeout = 10000) {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .withTimeout(timeout);
  },

  /**
   * Wait for element to exist with timeout
   */
  async waitForElementToExist(elementMatcher, timeout = 10000) {
    await waitFor(element(elementMatcher))
      .toExist()
      .withTimeout(timeout);
  },

  /**
   * Scroll to element in scroll view
   */
  async scrollToElement(scrollViewMatcher, elementMatcher, direction = 'down') {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollViewMatcher)
      .scroll(200, direction);
  },

  /**
   * Take screenshot with name
   */
  async takeScreenshot(name) {
    await device.takeScreenshot(name);
  },

  /**
   * Reset app to clean state
   */
  async resetApp() {
    await device.reloadReactNative();
  },

  /**
   * Send app to background and restore
   */
  async backgroundApp(duration = 2000) {
    await device.sendToHome();
    await new Promise(resolve => setTimeout(resolve, duration));
    await device.launchApp({ newInstance: false });
  },

  /**
   * Mock location for testing
   */
  async setMockLocation(latitude, longitude) {
    await device.setLocation(latitude, longitude);
  },

  /**
   * Clear app data
   */
  async clearAppData() {
    await device.clearKeychain();
  },

  /**
   * Login with test credentials
   */
  async loginWithTestCredentials() {
    await element(by.id('email-input')).typeText('test@tailtracker.com');
    await element(by.id('password-input')).typeText('testpassword123');
    await element(by.id('login-button')).tap();
    
    // Wait for main screen to load
    await waitFor(element(by.id('main-tab-navigator')))
      .toBeVisible()
      .withTimeout(10000);
  },

  /**
   * Create test pet
   */
  async createTestPet(petData = {}) {
    const defaultPetData = {
      name: 'Test Pet',
      type: 'dog',
      breed: 'Test Breed',
      ...petData
    };

    await element(by.id('add-pet-fab')).tap();
    await element(by.id('pet-name-input')).typeText(defaultPetData.name);
    await element(by.id('pet-type-selector')).tap();
    await element(by.text(defaultPetData.type)).tap();
    await element(by.id('pet-breed-input')).typeText(defaultPetData.breed);
    await element(by.id('save-pet-button')).tap();

    // Wait for pet to be created
    await waitFor(element(by.text(defaultPetData.name)))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Navigate to specific tab
   */
  async navigateToTab(tabName) {
    await element(by.id(`${tabName}-tab`)).tap();
    await waitFor(element(by.id(`${tabName}-screen`)))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Handle permissions dialog
   */
  async handlePermissionDialog(allow = true) {
    try {
      if (allow) {
        await element(by.text('Allow')).tap();
      } else {
        await element(by.text('Deny')).tap();
      }
    } catch (e) {
      // Permission dialog might not appear
      console.log('Permission dialog not found or already handled');
    }
  },

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete() {
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);
  },

  /**
   * Verify notification appears
   */
  async verifyNotificationAppears(notificationText) {
    // Pull down notification panel
    await device.openNotification();
    
    await waitFor(element(by.text(notificationText)))
      .toBeVisible()
      .withTimeout(5000);
    
    // Close notification panel
    await device.pressBack();
  }
};

// Test data
global.TestData = {
  users: {
    testUser: {
      email: 'test@tailtracker.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    },
    premiumUser: {
      email: 'premium@tailtracker.com',
      password: 'premiumpass123',
      firstName: 'Premium',
      lastName: 'User'
    }
  },
  
  pets: {
    testDog: {
      name: 'Buddy',
      type: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: 30,
      color: 'Golden'
    },
    testCat: {
      name: 'Whiskers',
      type: 'cat',
      breed: 'Persian',
      age: 2,
      weight: 5,
      color: 'White'
    }
  },
  
  locations: {
    home: {
      latitude: 37.7749,
      longitude: -122.4194,
      name: 'Home'
    },
    park: {
      latitude: 37.7849,
      longitude: -122.4094,
      name: 'Dog Park'
    }
  }
};

// Setup hooks
beforeAll(async () => {
  console.log('Starting E2E tests for TailTracker');
});

afterAll(async () => {
  console.log('E2E tests completed');
});

beforeEach(async () => {
  // Take screenshot before each test
  await TestHelpers.takeScreenshot('before-test');
});

afterEach(async () => {
  // Take screenshot after each test
  await TestHelpers.takeScreenshot('after-test');
});