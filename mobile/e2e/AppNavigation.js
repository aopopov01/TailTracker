const { element, by } = require('detox');
const TestHelpers = require('./TestHelpers');

class AppNavigation {
  /**
   * Navigate to login screen
   */
  static async goToLogin() {
    try {
      await TestHelpers.waitForElementToBeVisible(by.id('welcomeScreen'));
      await element(by.id('sign-in-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('login-screen'));
    } catch (error) {
      console.log('Failed to navigate to login:', error.message);
      throw error;
    }
  }

  /**
   * Login with user credentials
   */
  static async login(user) {
    try {
      await element(by.id('email-input')).typeText(user.email);
      await element(by.id('password-input')).typeText(user.password);
      await element(by.id('login-button')).tap();
      
      // Wait for main app to load
      await TestHelpers.waitForElementToExist(by.id('main-tab-navigator'), 15000);
    } catch (error) {
      console.log('Failed to login:', error.message);
      throw error;
    }
  }

  /**
   * Navigate to specific tab
   */
  static async goToTab(tabName) {
    await TestHelpers.navigateToTab(tabName);
  }

  /**
   * Navigate back
   */
  static async goBack() {
    try {
      await element(by.id('back-button')).tap();
    } catch (error) {
      console.log('Failed to navigate back:', error.message);
    }
  }
}

module.exports = AppNavigation;