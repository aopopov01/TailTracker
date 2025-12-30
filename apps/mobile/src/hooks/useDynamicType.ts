import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

interface DynamicTypeSettings {
  fontScale: number;
  isLargeTextEnabled: boolean;
  recommendedMaxFontSizeMultiplier: number;
}

export const useDynamicType = (): DynamicTypeSettings => {
  const [fontScale, setFontScale] = useState(1);
  const [isLargeTextEnabled, setIsLargeTextEnabled] = useState(false);

  useEffect(() => {
    const updateFontScale = () => {
      const { fontScale: currentFontScale } = Dimensions.get('window');
      setFontScale(currentFontScale);
      setIsLargeTextEnabled(currentFontScale > 1.3);
    };

    // Initial check
    updateFontScale();

    // Listen for changes
    const subscription = Dimensions.addEventListener('change', updateFontScale);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Calculate recommended max font size multiplier based on current scale
  const getRecommendedMaxFontSizeMultiplier = () => {
    if (Platform.OS === 'ios') {
      // iOS allows more aggressive scaling
      if (fontScale <= 1.0) return 1.5;
      if (fontScale <= 1.3) return 1.8;
      if (fontScale <= 1.6) return 2.0;
      return 2.5;
    } else {
      // Android more conservative scaling
      if (fontScale <= 1.0) return 1.3;
      if (fontScale <= 1.3) return 1.5;
      return 1.8;
    }
  };

  return {
    fontScale,
    isLargeTextEnabled,
    recommendedMaxFontSizeMultiplier: getRecommendedMaxFontSizeMultiplier(),
  };
};

export default useDynamicType;
