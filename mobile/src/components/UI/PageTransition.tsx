/**
 * TailTracker Page Transition Component
 * 
 * Smooth, beautiful page transitions that create a seamless
 * navigation experience with premium animations.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

import premiumAnimations from '../../design-system/animations/premiumAnimations';
import { useMaterialTheme } from '../../theme/MaterialThemeProvider';

// ====================================
// TYPES AND INTERFACES
// ====================================

export interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'slide' | 'fade' | 'scale' | 'hero';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  isVisible?: boolean;
  onTransitionComplete?: () => void;
  style?: ViewStyle;
}

export interface PageContainerProps {
  children: React.ReactNode;
  entering?: boolean;
  exiting?: boolean;
  transitionType?: 'slide' | 'fade' | 'scale' | 'hero';
  style?: ViewStyle;
}

// ====================================
// PAGE TRANSITION COMPONENT
// ====================================

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'slide',
  direction = 'right',
  duration,
  isVisible = true,
  onTransitionComplete,
  style,
}) => {
  const { theme } = useMaterialTheme();
  
  // Animation values
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Initialize animation based on visibility
  useEffect(() => {
    const transition = premiumAnimations.pages.transition(type);
    
    if (isVisible) {
      // Entering animation
      const { entering } = transition;
      
      if (entering.opacity) {
        opacity.value = entering.opacity;
      }
      if (entering.translateX) {
        translateX.value = entering.translateX;
      }
      if (entering.translateY) {
        translateY.value = entering.translateY;
      }
      if (entering.scale) {
        scale.value = entering.scale;
      }
      
      // Complete callback
      if (onTransitionComplete) {
        setTimeout(() => {
          runOnJS(onTransitionComplete)();
        }, premiumAnimations.timings.comfortable);
      }
    } else {
      // Exiting animation
      const { exiting } = transition;
      
      if (exiting.opacity) {
        opacity.value = exiting.opacity;
      }
      if (exiting.translateX) {
        translateX.value = exiting.translateX;
      }
      if (exiting.translateY) {
        translateY.value = exiting.translateY;
      }
      if (exiting.scale) {
        scale.value = exiting.scale;
      }
    }
  }, [isVisible, type, onTransitionComplete, opacity, scale, translateX, translateY]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ====================================
// PAGE CONTAINER COMPONENT
// ====================================

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  entering = true,
  exiting = false,
  transitionType = 'slide',
  style,
}) => {
  const { theme } = useMaterialTheme();
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.95);
  
  // Initialize page entrance
  useEffect(() => {
    if (entering) {
      const transition = premiumAnimations.pages.transition(transitionType);
      const { entering: enteringAnimation } = transition;
      
      // Apply entering animation
      if (enteringAnimation.opacity) {
        opacity.value = enteringAnimation.opacity;
      }
      if (enteringAnimation.translateX) {
        translateX.value = enteringAnimation.translateX;
      }
      if (enteringAnimation.translateY) {
        translateY.value = enteringAnimation.translateY;
      }
      if (enteringAnimation.scale) {
        scale.value = enteringAnimation.scale;
      }
    }
  }, [entering, transitionType, opacity, scale, translateX, translateY]);
  
  // Handle page exit
  useEffect(() => {
    if (exiting) {
      const transition = premiumAnimations.pages.transition(transitionType);
      const { exiting: exitingAnimation } = transition;
      
      // Apply exiting animation
      if (exitingAnimation.opacity) {
        opacity.value = exitingAnimation.opacity;
      }
      if (exitingAnimation.translateX) {
        translateX.value = exitingAnimation.translateX;
      }
      if (exitingAnimation.translateY) {
        translateY.value = exitingAnimation.translateY;
      }
      if (exitingAnimation.scale) {
        scale.value = exitingAnimation.scale;
      }
    }
  }, [exiting, transitionType, opacity, scale, translateX, translateY]);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  return (
    <Animated.View style={[styles.pageContainer, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ====================================
// STAGGER CONTAINER COMPONENT
// ====================================

export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  style?: ViewStyle;
}> = ({
  children,
  staggerDelay = 50,
  style,
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <View style={[styles.staggerContainer, style]}>
      {childrenArray.map((child, index) => (
        <StaggerItem key={index} delay={index * staggerDelay}>
          {child}
        </StaggerItem>
      ))}
    </View>
  );
};

// ====================================
// STAGGER ITEM COMPONENT
// ====================================

const StaggerItem: React.FC<{
  children: React.ReactNode;
  delay: number;
}> = ({ children, delay }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    setTimeout(() => {
      opacity.value = premiumAnimations.springs.gentle;
      translateY.value = premiumAnimations.springs.smooth;
    }, delay);
  }, [delay, opacity, translateY]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

// ====================================
// ROUTE TRANSITION WRAPPER
// ====================================

export const RouteTransition: React.FC<{
  children: React.ReactNode;
  route: string;
  previousRoute?: string;
  style?: ViewStyle;
}> = ({
  children,
  route,
  previousRoute,
  style,
}) => {
  const getTransitionType = (currentRoute: string, prevRoute?: string) => {
    // Define transition types based on route hierarchy
    const routeHierarchy = [
      'tabs',
      'pet-list',
      'pet-detail',
      'pet-edit',
      'pet-health',
      'settings',
    ];
    
    const currentIndex = routeHierarchy.indexOf(currentRoute);
    const prevIndex = prevRoute ? routeHierarchy.indexOf(prevRoute) : -1;
    
    if (currentIndex > prevIndex) {
      return 'slide'; // Going deeper
    } else if (currentIndex < prevIndex) {
      return 'slide'; // Going back
    } else {
      return 'fade'; // Same level or unknown
    }
  };
  
  const transitionType = getTransitionType(route, previousRoute);
  
  return (
    <PageTransition type={transitionType} style={style}>
      {children}
    </PageTransition>
  );
};

// ====================================
// TAB TRANSITION COMPONENT
// ====================================

export const TabTransition: React.FC<{
  children: React.ReactNode;
  activeTab: string;
  previousTab?: string;
  style?: ViewStyle;
}> = ({
  children,
  activeTab,
  previousTab,
  style,
}) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (activeTab !== previousTab && previousTab) {
      // Quick fade transition for tabs
      const tabTransition = premiumAnimations.screens.tabSwitch;
      
      // Fade out
      opacity.value = tabTransition.fadeOut.opacity;
      scale.value = tabTransition.fadeOut.scale;
      
      // Fade in after delay
      setTimeout(() => {
        opacity.value = tabTransition.fadeIn.opacity;
        scale.value = tabTransition.fadeIn.scale;
      }, tabTransition.duration / 2);
    }
  }, [activeTab, previousTab, opacity, scale]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });
  
  return (
    <Animated.View style={[styles.tabContainer, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ====================================
// HERO TRANSITION COMPONENT
// ====================================

export const HeroTransition: React.FC<{
  children: React.ReactNode;
  heroElement?: React.ReactNode;
  isVisible?: boolean;
  style?: ViewStyle;
}> = ({
  children,
  heroElement,
  isVisible = true,
  style,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);
  
  useEffect(() => {
    if (isVisible) {
      const heroTransition = premiumAnimations.screens.heroTransition;
      
      opacity.value = heroTransition.to.opacity;
      scale.value = heroTransition.to.scale;
      translateY.value = heroTransition.to.translateY;
    }
  }, [isVisible, opacity, scale, translateY]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    };
  });
  
  return (
    <View style={[styles.heroContainer, style]}>
      {heroElement && (
        <Animated.View style={[styles.heroElement, animatedStyle]}>
          {heroElement}
        </Animated.View>
      )}
      <Animated.View style={[styles.heroContent, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  staggerContainer: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
  heroContainer: {
    flex: 1,
  },
  heroElement: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  heroContent: {
    flex: 1,
  },
});

export default {
  PageTransition,
  PageContainer,
  StaggerContainer,
  RouteTransition,
  TabTransition,
  HeroTransition,
};