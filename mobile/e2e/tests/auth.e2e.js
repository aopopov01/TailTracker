const { device, element, by, expect } = require('detox');
const TestData = require('../TestData');
const TestHelpers = require('../TestHelpers');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await TestHelpers.clearAppData();
  });

  describe('Welcome Screen', () => {
    it('should show welcome screen on first launch', async () => {
      await TestHelpers.waitForElementToBeVisible(by.id('welcome-screen'));
      
      // Verify welcome elements
      await expect(element(by.id('welcome-title'))).toBeVisible();
      await expect(element(by.id('welcome-subtitle'))).toBeVisible();
      await expect(element(by.id('get-started-button'))).toBeVisible();
      await expect(element(by.id('sign-in-button'))).toBeVisible();
    });

    it('should navigate to onboarding when Get Started is tapped', async () => {
      await element(by.id('get-started-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('onboarding-screen'));
    });

    it('should navigate to login when Sign In is tapped', async () => {
      await element(by.id('sign-in-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('login-screen'));
    });
  });

  describe('Onboarding Flow', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('onboarding-screen'));
    });

    it('should show onboarding slides', async () => {
      // First slide
      await expect(element(by.id('onboarding-slide-0'))).toBeVisible();
      await expect(element(by.id('onboarding-title-0'))).toHaveText('Track Your Pets');
      
      // Navigate to next slide
      await element(by.id('next-button')).tap();
      
      // Second slide
      await expect(element(by.id('onboarding-slide-1'))).toBeVisible();
      await expect(element(by.id('onboarding-title-1'))).toHaveText('Safe Zones');
      
      // Navigate to next slide
      await element(by.id('next-button')).tap();
      
      // Third slide
      await expect(element(by.id('onboarding-slide-2'))).toBeVisible();
      await expect(element(by.id('onboarding-title-2'))).toHaveText('Health Monitoring');
    });

    it('should allow skipping onboarding', async () => {
      await element(by.id('skip-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('login-screen'));
    });

    it('should navigate to registration after onboarding', async () => {
      // Go through all slides
      await element(by.id('next-button')).tap();
      await element(by.id('next-button')).tap();
      await element(by.id('get-started-button')).tap();
      
      await TestHelpers.waitForElementToBeVisible(by.id('register-screen'));
    });
  });

  describe('Registration', () => {
    beforeEach(async () => {
      await element(by.id('get-started-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('onboarding-screen'));
      await element(by.id('skip-button')).tap();
      await element(by.id('create-account-link')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('register-screen'));
    });

    it('should show registration form', async () => {
      await expect(element(by.id('register-title'))).toHaveText('Create Account');
      await expect(element(by.id('first-name-input'))).toBeVisible();
      await expect(element(by.id('last-name-input'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('confirm-password-input'))).toBeVisible();
      await expect(element(by.id('register-button'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('register-button')).tap();
      
      // Should show validation errors
      await TestHelpers.waitForElementToBeVisible(by.text('First name is required'));
      await TestHelpers.waitForElementToBeVisible(by.text('Email is required'));
      await TestHelpers.waitForElementToBeVisible(by.text('Password is required'));
    });

    it('should validate email format', async () => {
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('register-button')).tap();
      
      await TestHelpers.waitForElementToBeVisible(by.text('Please enter a valid email'));
    });

    it('should validate password confirmation', async () => {
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('different-password');
      await element(by.id('register-button')).tap();
      
      await TestHelpers.waitForElementToBeVisible(by.text('Passwords do not match'));
    });

    it('should register new user successfully', async () => {
      const testUser = TestData.users.testUser;
      
      await element(by.id('first-name-input')).typeText(testUser.firstName);
      await element(by.id('last-name-input')).typeText(testUser.lastName);
      await element(by.id('email-input')).typeText(testUser.email);
      await element(by.id('password-input')).typeText(testUser.password);
      await element(by.id('confirm-password-input')).typeText(testUser.password);
      
      await element(by.id('register-button')).tap();
      
      // Should show loading
      await TestHelpers.waitForElementToBeVisible(by.id('loading-indicator'));
      
      // Should navigate to main app or verification screen
      await TestHelpers.waitForElementToExist(by.id('main-tab-navigator'), 15000);
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await element(by.id('sign-in-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('login-screen'));
    });

    it('should show login form', async () => {
      await expect(element(by.id('login-title'))).toHaveText('Sign In');
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
      await expect(element(by.id('forgot-password-link'))).toBeVisible();
    });

    it('should validate login fields', async () => {
      await element(by.id('login-button')).tap();
      
      await TestHelpers.waitForElementToBeVisible(by.text('Email is required'));
      await TestHelpers.waitForElementToBeVisible(by.text('Password is required'));
    });

    it('should handle invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      // Should show error message
      await TestHelpers.waitForElementToBeVisible(by.text('Invalid email or password'));
    });

    it('should login successfully with valid credentials', async () => {
      const testUser = TestData.users.testUser;
      
      await element(by.id('email-input')).typeText(testUser.email);
      await element(by.id('password-input')).typeText(testUser.password);
      await element(by.id('login-button')).tap();
      
      // Should show loading
      await TestHelpers.waitForElementToBeVisible(by.id('loading-indicator'));
      
      // Should navigate to main app
      await TestHelpers.waitForElementToExist(by.id('main-tab-navigator'), 15000);
    });

    it('should navigate to forgot password screen', async () => {
      await element(by.id('forgot-password-link')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('forgot-password-screen'));
    });
  });

  describe('Forgot Password', () => {
    beforeEach(async () => {
      await element(by.id('sign-in-button')).tap();
      await element(by.id('forgot-password-link')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('forgot-password-screen'));
    });

    it('should show forgot password form', async () => {
      await expect(element(by.id('forgot-password-title'))).toHaveText('Reset Password');
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('reset-password-button'))).toBeVisible();
    });

    it('should validate email field', async () => {
      await element(by.id('reset-password-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.text('Email is required'));
    });

    it('should send reset password email', async () => {
      await element(by.id('email-input')).typeText(TestData.users.testUser.email);
      await element(by.id('reset-password-button')).tap();
      
      // Should show success message
      await TestHelpers.waitForElementToBeVisible(by.text('Reset instructions sent to your email'));
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Login first
      await TestHelpers.loginWithTestCredentials();
    });

    it('should logout successfully', async () => {
      // Navigate to profile/settings
      await TestHelpers.navigateToTab('profile');
      
      // Find and tap logout button
      await element(by.id('logout-button')).tap();
      
      // Confirm logout
      await element(by.text('Logout')).tap();
      
      // Should return to welcome screen
      await TestHelpers.waitForElementToBeVisible(by.id('welcome-screen'));
    });
  });
});