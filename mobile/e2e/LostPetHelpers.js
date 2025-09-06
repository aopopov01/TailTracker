const { element, by } = require('detox');
const TestHelpers = require('./TestHelpers');

class LostPetHelpers {
  /**
   * Report a pet as lost
   */
  static async reportLostPet(petName) {
    try {
      // Navigate to pets tab
      await element(by.id('petsTab')).tap();
      await TestHelpers.waitForElementToBeVisible(by.text(petName));
      
      // Select the pet
      await element(by.text(petName)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
      
      // Tap report lost button
      await element(by.id('reportLostButton')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('lostPetForm'));
      
      // Fill basic information
      await element(by.id('lastSeenLocationInput')).typeText('Test Location');
      await element(by.id('descriptionInput')).typeText('Test lost pet description');
      await element(by.id('contactPhoneInput')).typeText('+1-555-TEST-123');
      
      // Submit the report
      await element(by.id('submitLostPetReport')).tap();
      await TestHelpers.waitForElementToBeVisible(by.text('Lost Pet Report Created'));
      
      console.log(`Successfully reported ${petName} as lost`);
    } catch (error) {
      console.log(`Failed to report ${petName} as lost:`, error.message);
      throw error;
    }
  }

  /**
   * Mark a pet as found
   */
  static async markPetAsFound(petName) {
    try {
      // Navigate to lost pet alerts
      await element(by.id('alertsTab')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('lost-pet-alerts-screen'));
      
      // Find the lost pet in the list
      await TestHelpers.waitForElementToBeVisible(by.text(petName));
      await element(by.text(petName)).tap();
      
      // Mark as found
      await element(by.id('markFoundButton')).tap();
      await element(by.text('Yes, Mark as Found')).tap();
      
      // Wait for confirmation
      await TestHelpers.waitForElementToBeVisible(by.text('Pet Marked as Found'));
      
      console.log(`Successfully marked ${petName} as found`);
    } catch (error) {
      console.log(`Failed to mark ${petName} as found:`, error.message);
      throw error;
    }
  }

  /**
   * Create test lost pet alert
   */
  static async createTestAlert(petData, alertData = {}) {
    try {
      await this.reportLostPet(petData.name);
      console.log(`Created test alert for ${petData.name}`);
    } catch (error) {
      console.log('Failed to create test alert:', error.message);
      throw error;
    }
  }

  /**
   * Search for lost pets in area
   */
  static async searchLostPetsInArea(radius = 5) {
    try {
      await element(by.id('alertsTab')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('lost-pet-alerts-screen'));
      
      // Set search radius
      await element(by.id('searchRadiusSlider')).tap();
      // Simulate setting radius value
      
      console.log(`Searching for lost pets within ${radius} miles`);
    } catch (error) {
      console.log('Failed to search for lost pets:', error.message);
      throw error;
    }
  }
}

module.exports = LostPetHelpers;