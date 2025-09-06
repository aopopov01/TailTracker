const { device, element, by, expect } = require('detox');
const TestData = require('../TestData');
const TestHelpers = require('../TestHelpers');

describe('Pet Management', () => {
  beforeAll(async () => {
    await device.launchApp();
    await TestHelpers.loginWithTestCredentials();
  });

  beforeEach(async () => {
    await TestHelpers.navigateToTab('pets');
  });

  afterAll(async () => {
    await TestHelpers.clearAppData();
  });

  describe('Pet List', () => {
    it('should show empty state when no pets exist', async () => {
      await TestHelpers.waitForElementToBeVisible(by.id('pets-screen'));
      
      // Check for empty state
      await expect(element(by.id('empty-pets-state'))).toBeVisible();
      await expect(element(by.text('No pets added yet'))).toBeVisible();
      await expect(element(by.id('add-first-pet-button'))).toBeVisible();
    });

    it('should show add pet FAB', async () => {
      await expect(element(by.id('add-pet-fab'))).toBeVisible();
    });

    it('should display pet list when pets exist', async () => {
      // Add a test pet first
      await TestHelpers.createTestPet(TestData.pets.testDog);
      
      // Verify pet appears in list
      await expect(element(by.id('pet-list'))).toBeVisible();
      await expect(element(by.text(TestData.pets.testDog.name))).toBeVisible();
      await expect(element(by.text(TestData.pets.testDog.breed))).toBeVisible();
    });
  });

  describe('Add Pet Flow', () => {
    beforeEach(async () => {
      await element(by.id('add-pet-fab')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('add-pet-screen'));
    });

    it('should show add pet form', async () => {
      await expect(element(by.id('add-pet-title'))).toHaveText('Add New Pet');
      await expect(element(by.id('pet-name-input'))).toBeVisible();
      await expect(element(by.id('pet-type-selector'))).toBeVisible();
      await expect(element(by.id('pet-breed-input'))).toBeVisible();
      await expect(element(by.id('pet-age-input'))).toBeVisible();
      await expect(element(by.id('pet-weight-input'))).toBeVisible();
      await expect(element(by.id('save-pet-button'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      await element(by.id('save-pet-button')).tap();
      
      // Should show validation errors
      await TestHelpers.waitForElementToBeVisible(by.text('Pet name is required'));
      await TestHelpers.waitForElementToBeVisible(by.text('Pet type is required'));
    });

    it('should select pet type', async () => {
      await element(by.id('pet-type-selector')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-type-modal'));
      
      // Should show pet type options
      await expect(element(by.text('Dog'))).toBeVisible();
      await expect(element(by.text('Cat'))).toBeVisible();
      await expect(element(by.text('Bird'))).toBeVisible();
      
      // Select dog
      await element(by.text('Dog')).tap();
      
      // Modal should close and selection should be visible
      await TestHelpers.waitForElementToBeVisible(by.text('Dog'));
    });

    it('should allow photo selection', async () => {
      await element(by.id('pet-photo-selector')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('photo-options-modal'));
      
      // Should show photo options
      await expect(element(by.text('Take Photo'))).toBeVisible();
      await expect(element(by.text('Choose from Gallery'))).toBeVisible();
      
      // Handle camera permission if needed
      await element(by.text('Take Photo')).tap();
      await TestHelpers.handlePermissionDialog(true);
    });

    it('should create pet successfully', async () => {
      const testPet = TestData.pets.testDog;
      
      await element(by.id('pet-name-input')).typeText(testPet.name);
      
      // Select pet type
      await element(by.id('pet-type-selector')).tap();
      await element(by.text('Dog')).tap();
      
      await element(by.id('pet-breed-input')).typeText(testPet.breed);
      await element(by.id('pet-age-input')).typeText(testPet.age.toString());
      await element(by.id('pet-weight-input')).typeText(testPet.weight.toString());
      
      await element(by.id('save-pet-button')).tap();
      
      // Should show success and return to pet list
      await TestHelpers.waitForElementToBeVisible(by.id('pets-screen'));
      await expect(element(by.text(testPet.name))).toBeVisible();
    });
  });

  describe('Pet Detail View', () => {
    beforeEach(async () => {
      // Ensure we have a pet to work with
      await TestHelpers.createTestPet(TestData.pets.testDog);
      await element(by.text(TestData.pets.testDog.name)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
    });

    it('should show pet details', async () => {
      const testPet = TestData.pets.testDog;
      
      await expect(element(by.id('pet-detail-title'))).toHaveText(testPet.name);
      await expect(element(by.text(testPet.breed))).toBeVisible();
      await expect(element(by.text(`${testPet.age} years old`))).toBeVisible();
      await expect(element(by.text(`${testPet.weight} lbs`))).toBeVisible();
    });

    it('should show pet status card', async () => {
      await expect(element(by.id('pet-status-card'))).toBeVisible();
      await expect(element(by.id('location-status'))).toBeVisible();
      await expect(element(by.id('battery-status'))).toBeVisible();
      await expect(element(by.id('last-seen'))).toBeVisible();
    });

    it('should show pet actions', async () => {
      await expect(element(by.id('view-location-button'))).toBeVisible();
      await expect(element(by.id('track-pet-button'))).toBeVisible();
      await expect(element(by.id('set-safe-zone-button'))).toBeVisible();
    });

    it('should navigate to location when View Location is tapped', async () => {
      await element(by.id('view-location-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('map-screen'));
      
      // Should show pet location on map
      await expect(element(by.id('pet-marker'))).toBeVisible();
    });

    it('should show edit menu', async () => {
      // Tap menu button
      await element(by.id('pet-menu-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-menu-modal'));
      
      await expect(element(by.text('Edit Pet'))).toBeVisible();
      await expect(element(by.text('Health Records'))).toBeVisible();
      await expect(element(by.text('Location History'))).toBeVisible();
      await expect(element(by.text('Delete Pet'))).toBeVisible();
    });
  });

  describe('Edit Pet', () => {
    beforeEach(async () => {
      await TestHelpers.createTestPet(TestData.pets.testDog);
      await element(by.text(TestData.pets.testDog.name)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
      
      // Open edit
      await element(by.id('pet-menu-button')).tap();
      await element(by.text('Edit Pet')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('edit-pet-screen'));
    });

    it('should pre-fill form with existing pet data', async () => {
      const testPet = TestData.pets.testDog;
      
      await expect(element(by.id('pet-name-input'))).toHaveText(testPet.name);
      await expect(element(by.id('pet-breed-input'))).toHaveText(testPet.breed);
    });

    it('should update pet information', async () => {
      const updatedName = 'Updated Pet Name';
      
      await element(by.id('pet-name-input')).clearText();
      await element(by.id('pet-name-input')).typeText(updatedName);
      
      await element(by.id('save-pet-button')).tap();
      
      // Should return to detail view with updated data
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
      await expect(element(by.id('pet-detail-title'))).toHaveText(updatedName);
    });
  });

  describe('Delete Pet', () => {
    beforeEach(async () => {
      await TestHelpers.createTestPet(TestData.pets.testDog);
      await element(by.text(TestData.pets.testDog.name)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
    });

    it('should show confirmation dialog', async () => {
      await element(by.id('pet-menu-button')).tap();
      await element(by.text('Delete Pet')).tap();
      
      await TestHelpers.waitForElementToBeVisible(by.id('delete-confirmation-dialog'));
      await expect(element(by.text('Are you sure?'))).toBeVisible();
      await expect(element(by.text('This action cannot be undone'))).toBeVisible();
    });

    it('should cancel deletion', async () => {
      await element(by.id('pet-menu-button')).tap();
      await element(by.text('Delete Pet')).tap();
      
      await element(by.text('Cancel')).tap();
      
      // Should still be on pet detail screen
      await expect(element(by.id('pet-detail-screen'))).toBeVisible();
    });

    it('should delete pet successfully', async () => {
      const testPet = TestData.pets.testDog;
      
      await element(by.id('pet-menu-button')).tap();
      await element(by.text('Delete Pet')).tap();
      await element(by.text('Delete')).tap();
      
      // Should return to pet list
      await TestHelpers.waitForElementToBeVisible(by.id('pets-screen'));
      
      // Pet should no longer be in list
      await expect(element(by.text(testPet.name))).not.toBeVisible();
    });
  });

  describe('Multiple Pets', () => {
    beforeEach(async () => {
      // Add multiple test pets
      await TestHelpers.createTestPet(TestData.pets.testDog);
      await TestHelpers.createTestPet(TestData.pets.testCat);
    });

    it('should show all pets in list', async () => {
      await expect(element(by.text(TestData.pets.testDog.name))).toBeVisible();
      await expect(element(by.text(TestData.pets.testCat.name))).toBeVisible();
    });

    it('should allow switching between pets', async () => {
      // Tap first pet
      await element(by.text(TestData.pets.testDog.name)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
      await expect(element(by.id('pet-detail-title'))).toHaveText(TestData.pets.testDog.name);
      
      // Go back and tap second pet
      await element(by.id('back-button')).tap();
      await element(by.text(TestData.pets.testCat.name)).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('pet-detail-screen'));
      await expect(element(by.id('pet-detail-title'))).toHaveText(TestData.pets.testCat.name);
    });

    it('should show pet type indicators', async () => {
      await expect(element(by.id('pet-type-dog'))).toBeVisible();
      await expect(element(by.id('pet-type-cat'))).toBeVisible();
    });
  });

  describe('Search and Filter', () => {
    beforeEach(async () => {
      await TestHelpers.createTestPet(TestData.pets.testDog);
      await TestHelpers.createTestPet(TestData.pets.testCat);
    });

    it('should show search bar', async () => {
      await expect(element(by.id('pet-search-input'))).toBeVisible();
    });

    it('should filter pets by name', async () => {
      await element(by.id('pet-search-input')).typeText('Buddy');
      
      // Should show only matching pet
      await expect(element(by.text(TestData.pets.testDog.name))).toBeVisible();
      await expect(element(by.text(TestData.pets.testCat.name))).not.toBeVisible();
    });

    it('should show filter options', async () => {
      await element(by.id('filter-button')).tap();
      await TestHelpers.waitForElementToBeVisible(by.id('filter-modal'));
      
      await expect(element(by.text('Pet Type'))).toBeVisible();
      await expect(element(by.text('Age'))).toBeVisible();
      await expect(element(by.text('Status'))).toBeVisible();
    });
  });
});