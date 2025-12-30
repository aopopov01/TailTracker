/**
 * Clear all local app data including AsyncStorage
 * Run this script to completely reset the app's local state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearAllLocalData() {
  try {
    console.log('🧹 Clearing all local app data...');

    // Get all AsyncStorage keys
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Found AsyncStorage keys:', keys);

    // Clear all AsyncStorage data
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
      console.log('✅ Cleared all AsyncStorage data');
    } else {
      console.log('ℹ️ No AsyncStorage data found');
    }

    // Verify clearing
    const remainingKeys = await AsyncStorage.getAllKeys();
    if (remainingKeys.length === 0) {
      console.log('✅ Local data successfully cleared');
    } else {
      console.log('⚠️ Some data may still remain:', remainingKeys);
    }
  } catch (error) {
    console.error('❌ Error clearing local data:', error);
  }
}

// Export for use in other parts of the app
export { clearAllLocalData };

// Self-execute if run directly
if (require.main === module) {
  clearAllLocalData();
}
