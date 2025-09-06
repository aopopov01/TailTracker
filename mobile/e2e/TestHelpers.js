const { device, element, by } = require('detox');

class TestHelpers {
  /**
   * Wait for an element to be visible with timeout
   */
  static async waitForElementToBeVisible(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
  }

  /**
   * Wait for an element to exist with timeout
   */
  static async waitForElementToExist(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toExist()
      .withTimeout(timeout);
  }

  /**
   * Clear app data for fresh test runs
   */
  static async clearAppData() {
    await device.uninstallApp();
    await device.installApp();
  }

  /**
   * Login with test credentials
   */
  static async loginWithTestCredentials() {
    const TestData = require('./TestData');
    const testUser = TestData.users.testUser;
    
    await device.launchApp({ newInstance: true });
    
    // Navigate to login
    await element(by.id('sign-in-button')).tap();
    await this.waitForElementToBeVisible(by.id('login-screen'));
    
    // Fill credentials
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();
    
    // Wait for main app
    await this.waitForElementToExist(by.id('main-tab-navigator'), 15000);
  }

  /**
   * Navigate to specific tab
   */
  static async navigateToTab(tabName) {
    await element(by.id(`${tabName}-tab`)).tap();
    await this.waitForElementToBeVisible(by.id(`${tabName}-screen`));
  }

  /**
   * Take a screenshot for debugging
   */
  static async takeScreenshot(name) {
    await device.takeScreenshot(name);
  }

  /**
   * Wait for loading to complete
   */
  static async waitForLoadingToComplete() {
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);
  }

  /**
   * Create a test pet
   */
  static async createTestPet(petData) {
    await this.navigateToTab('pets');
    await element(by.id('add-pet-fab')).tap();
    await this.waitForElementToBeVisible(by.id('add-pet-screen'));
    
    await element(by.id('pet-name-input')).typeText(petData.name);
    
    // Select pet type
    await element(by.id('pet-type-selector')).tap();
    await element(by.text(petData.species)).tap();
    
    if (petData.breed) {
      await element(by.id('pet-breed-input')).typeText(petData.breed);
    }
    
    if (petData.age) {
      await element(by.id('pet-age-input')).typeText(petData.age.toString());
    }
    
    if (petData.weight) {
      await element(by.id('pet-weight-input')).typeText(petData.weight.toString());
    }
    
    await element(by.id('save-pet-button')).tap();
    await this.waitForElementToBeVisible(by.id('pets-screen'));
  }

  /**
   * Handle permission dialogs
   */
  static async handlePermissionDialog(allow = true) {
    try {
      if (allow) {
        await element(by.text('Allow')).tap();
      } else {
        await element(by.text('Deny')).tap();
      }
    } catch (_error) {
      // Permission dialog might not appear
      console.log('Permission dialog not found or already handled');
    }
  }
}

module.exports = TestHelpers;