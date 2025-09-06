/**
 * TailTracker Navigation Animation Example
 * 
 * Comprehensive example showing how to create emotionally intelligent
 * navigation transitions that maintain user flow and emotional state.
 * 
 * Features demonstrated:
 * - Context-aware screen transitions
 * - Shared element animations
 * - Tab transition animations
 * - Modal presentation animations
 * - Performance-optimized navigation
 * - Accessibility-aware transitions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Pressable,
  ScrollView,
} from 'react-native';
import { Haptics } from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

// Import our animation systems
import {
  useEmotionalIntelligence,
  useAdaptiveLoadingAnimation,
} from '../emotionalIntelligenceHooks';
import { tailTrackerMotions } from '../motionSystem';
import { useAnimationProfiler } from '../performanceMonitoring';
import {
  useEmotionalTransition,
  usePremiumButtonAnimation,
  usePetCardAnimation,
} from '../premiumMicroInteractions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ====================================
// TYPES
// ====================================

interface Screen {
  id: string;
  name: string;
  title: string;
  icon: string;
  transitionType: 'discovery' | 'success' | 'exploration' | 'return';
  emotionalContext: 'routine' | 'emergency' | 'bonding' | 'health_check';
}

interface NavigationState {
  currentScreen: string;
  previousScreen?: string;
  isTransitioning: boolean;
  navigationHistory: string[];
}

// ====================================
// SCREEN CONFIGURATIONS
// ====================================

const SCREENS: Screen[] = [
  {
    id: 'home',
    name: 'Home',
    title: 'Welcome Home 🏠',
    icon: '🏠',
    transitionType: 'return',
    emotionalContext: 'routine',
  },
  {
    id: 'pets',
    name: 'My Pets',
    title: 'Your Furry Family 🐾',
    icon: '🐾',
    transitionType: 'exploration',
    emotionalContext: 'bonding',
  },
  {
    id: 'tracking',
    name: 'Live Tracking',
    title: 'Where\'s My Pet? 📍',
    icon: '📍',
    transitionType: 'discovery',
    emotionalContext: 'routine',
  },
  {
    id: 'health',
    name: 'Health Monitor',
    title: 'Health Dashboard 💗',
    icon: '💗',
    transitionType: 'discovery',
    emotionalContext: 'health_check',
  },
  {
    id: 'community',
    name: 'Community',
    title: 'Pet Parents Unite 👥',
    icon: '👥',
    transitionType: 'exploration',
    emotionalContext: 'bonding',
  },
  {
    id: 'emergency',
    name: 'Emergency',
    title: 'Emergency Help 🚨',
    icon: '🚨',
    transitionType: 'discovery',
    emotionalContext: 'emergency',
  },
];

// ====================================
// ANIMATED NAVIGATION COMPONENT
// ====================================

export const AnimatedNavigation: React.FC = () => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentScreen: 'home',
    isTransitioning: false,
    navigationHistory: ['home'],
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tabBarVisible, setTabBarVisible] = useState(true);

  // Performance monitoring
  const { startProfiling, stopProfiling } = useAnimationProfiler(
    'navigation_transition',
    'high'
  );

  // Emotional intelligence
  const {
    userState,
    appContext,
    inferEmotionalState,
    setAppContext,
    getOptimalAnimationConfig,
  } = useEmotionalIntelligence();

  // Screen transition animations
  const currentScreen = SCREENS.find(s => s.id === navigationState.currentScreen) || SCREENS[0];
  
  const {
    animatedStyle: screenTransitionStyle,
    enter: enterScreen,
    exit: exitScreen,
  } = useEmotionalTransition(currentScreen.transitionType);

  // Tab bar animations
  const tabBarTranslateY = useSharedValue(0);
  const tabBarOpacity = useSharedValue(1);

  // Modal animations
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Screen loading animation
  const {
    animatedStyle: loadingStyle,
    currentAnimation,
  } = useAdaptiveLoadingAnimation('quick');

  // Floating action button animation
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);

  // ====================================
  // NAVIGATION FUNCTIONS
  // ====================================

  const navigateToScreen = useCallback(async (screenId: string, options?: {
    skipAnimation?: boolean;
    showLoading?: boolean;
  }) => {
    if (navigationState.isTransitioning || screenId === navigationState.currentScreen) {
      return;
    }

    const targetScreen = SCREENS.find(s => s.id === screenId);
    if (!targetScreen) return;

    startProfiling();
    
    setNavigationState(prev => ({
      ...prev,
      isTransitioning: true,
      previousScreen: prev.currentScreen,
    }));

    // Update app context for emotional intelligence
    setAppContext(prev => ({
      ...prev,
      screen: screenId,
      petInteractionContext: targetScreen.emotionalContext,
      userAction: targetScreen.emotionalContext === 'emergency' ? 'troubleshooting' : 'browsing',
    }));

    // Infer emotional state based on navigation context
    if (targetScreen.emotionalContext === 'emergency') {
      inferEmotionalState('emergency');
    } else if (targetScreen.emotionalContext === 'bonding') {
      inferEmotionalState('discovery');
    } else {
      inferEmotionalState('routine');
    }

    if (!options?.skipAnimation) {
      // Exit current screen
      await new Promise<void>((resolve) => {
        exitScreen();
        setTimeout(resolve, 150);
      });

      // Show loading if needed
      if (options?.showLoading) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 300);
        });
      }

      // Update screen and enter new screen
      setNavigationState(prev => ({
        ...prev,
        currentScreen: screenId,
        navigationHistory: [...prev.navigationHistory, screenId],
      }));

      setTimeout(() => {
        enterScreen();
        setNavigationState(prev => ({
          ...prev,
          isTransitioning: false,
        }));
        stopProfiling();
      }, 100);
    } else {
      // Instant navigation
      setNavigationState(prev => ({
        ...prev,
        currentScreen: screenId,
        navigationHistory: [...prev.navigationHistory, screenId],
        isTransitioning: false,
      }));
      stopProfiling();
    }
  }, [navigationState, enterScreen, exitScreen, setAppContext, inferEmotionalState, startProfiling, stopProfiling]);

  const goBack = useCallback(() => {
    const history = navigationState.navigationHistory;
    if (history.length > 1) {
      const previousScreen = history[history.length - 2];
      setNavigationState(prev => ({
        ...prev,
        navigationHistory: history.slice(0, -1),
      }));
      navigateToScreen(previousScreen);
    }
  }, [navigationState.navigationHistory, navigateToScreen]);

  // ====================================
  // MODAL FUNCTIONS
  // ====================================

  const showModal = useCallback(() => {
    setIsModalVisible(true);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    backdropOpacity.value = withTiming(1, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeOut,
    });

    modalOpacity.value = withTiming(1, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeOut,
    });

    modalScale.value = withSequence(
      withTiming(1.1, {
        duration: tailTrackerMotions.durations.quick,
        easing: tailTrackerMotions.easing.easeOut,
      }),
      withTiming(1, {
        duration: tailTrackerMotions.durations.instant,
        easing: tailTrackerMotions.easing.easeOut,
      })
    );
  }, [backdropOpacity, modalOpacity, modalScale]);

  const hideModal = useCallback(() => {
    backdropOpacity.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    });

    modalOpacity.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    });

    modalScale.value = withTiming(0.9, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    }, () => {
      runOnJS(setIsModalVisible)(false);
    });
  }, [backdropOpacity, modalOpacity, modalScale]);

  // ====================================
  // TAB BAR FUNCTIONS
  // ====================================

  const hideTabBar = useCallback(() => {
    setTabBarVisible(false);
    
    tabBarTranslateY.value = withSpring(100, {
      damping: 20,
      stiffness: 300,
    });

    tabBarOpacity.value = withTiming(0, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeIn,
    });
  }, [tabBarOpacity, tabBarTranslateY]);

  const showTabBar = useCallback(() => {
    setTabBarVisible(true);
    
    tabBarTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });

    tabBarOpacity.value = withTiming(1, {
      duration: tailTrackerMotions.durations.standard,
      easing: tailTrackerMotions.easing.easeOut,
    });
  }, [tabBarOpacity, tabBarTranslateY]);

  // ====================================
  // FAB FUNCTIONS
  // ====================================

  const animateFAB = useCallback((action: 'press' | 'emergency' | 'success') => {
    switch (action) {
      case 'press':
        fabScale.value = withSequence(
          withTiming(0.9, {
            duration: tailTrackerMotions.durations.instant,
            easing: tailTrackerMotions.easing.easeOut,
          }),
          withTiming(1, {
            duration: tailTrackerMotions.durations.quick,
            easing: tailTrackerMotions.easing.bounce,
          })
        );
        break;
      case 'emergency':
        fabScale.value = withRepeat(
          withSequence(
            withTiming(1.2, {
              duration: 200,
              easing: tailTrackerMotions.easing.easeOut,
            }),
            withTiming(1, {
              duration: 200,
              easing: tailTrackerMotions.easing.easeIn,
            })
          ),
          3,
          false
        );
        fabRotation.value = withSequence(
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        break;
      case 'success':
        fabRotation.value = withTiming(360, {
          duration: tailTrackerMotions.durations.celebration,
          easing: tailTrackerMotions.easing.easeInOut,
        }, () => {
          fabRotation.value = 0;
        });
        break;
    }
  }, [fabRotation, fabScale]);

  // ====================================
  // COMPONENT EFFECTS
  // ====================================

  useEffect(() => {
    // Initial screen entry animation
    setTimeout(() => enterScreen(), 500);
  }, [enterScreen]);

  // Emergency screen handling
  useEffect(() => {
    if (navigationState.currentScreen === 'emergency') {
      hideTabBar();
      animateFAB('emergency');
    } else if (!tabBarVisible) {
      showTabBar();
    }
  }, [navigationState.currentScreen, animateFAB, hideTabBar, showTabBar, tabBarVisible]);

  // ====================================
  // ANIMATED STYLES
  // ====================================

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
    opacity: tabBarOpacity.value,
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  // ====================================
  // RENDER FUNCTIONS
  // ====================================

  const renderScreen = (screen: Screen) => (
    <Animated.View style={[styles.screenContent, screenTransitionStyle]}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>{screen.title}</Text>
        <Text style={styles.screenIcon}>{screen.icon}</Text>
      </View>

      <ScrollView style={styles.screenScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Screen Context</Text>
          <Text style={styles.sectionText}>
            Emotional Context: {screen.emotionalContext.replace('_', ' ')}
          </Text>
          <Text style={styles.sectionText}>
            Transition Type: {screen.transitionType}
          </Text>
          <Text style={styles.sectionText}>
            User State: {userState.primary} ({userState.intensity})
          </Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Navigation Options</Text>
          <View style={styles.buttonGrid}>
            {SCREENS.filter(s => s.id !== screen.id).map(targetScreen => (
              <Pressable
                key={targetScreen.id}
                style={styles.navigationButton}
                onPress={() => navigateToScreen(targetScreen.id)}
                disabled={navigationState.isTransitioning}
              >
                <Text style={styles.navigationButtonIcon}>{targetScreen.icon}</Text>
                <Text style={styles.navigationButtonText}>{targetScreen.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Animation Controls</Text>
          <View style={styles.controlsContainer}>
            <Pressable style={styles.controlButton} onPress={showModal}>
              <Text style={styles.controlButtonText}>Show Modal</Text>
            </Pressable>
            
            <Pressable 
              style={styles.controlButton} 
              onPress={() => animateFAB('success')}
            >
              <Text style={styles.controlButtonText}>Celebrate FAB</Text>
            </Pressable>

            {navigationState.navigationHistory.length > 1 && (
              <Pressable style={styles.controlButton} onPress={goBack}>
                <Text style={styles.controlButtonText}>← Go Back</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Loading overlay */}
      {navigationState.isTransitioning && (
        <Animated.View style={[styles.loadingOverlay, loadingStyle]}>
          <Text style={styles.loadingText}>
            {currentAnimation === 'pawprints' ? '🐾' : 
             currentAnimation === 'heartbeat' ? '💗' : '⭕'}
          </Text>
          <Text style={styles.loadingLabel}>Transitioning...</Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderTabBar = () => (
    <Animated.View style={[styles.tabBar, tabBarAnimatedStyle]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
        style={styles.tabBarGradient}
      />
      
      {SCREENS.slice(0, 5).map(screen => (
        <Pressable
          key={screen.id}
          style={[
            styles.tabButton,
            navigationState.currentScreen === screen.id && styles.tabButtonActive,
          ]}
          onPress={() => navigateToScreen(screen.id)}
          disabled={navigationState.isTransitioning}
        >
          <Text style={[
            styles.tabIcon,
            navigationState.currentScreen === screen.id && styles.tabIconActive,
          ]}>
            {screen.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            navigationState.currentScreen === screen.id && styles.tabLabelActive,
          ]}>
            {screen.name}
          </Text>
        </Pressable>
      ))}
    </Animated.View>
  );

  const renderModal = () => {
    if (!isModalVisible) return null;

    return (
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.modalBackdrop, modalBackdropStyle]}>
          <Pressable style={styles.modalBackdropPressable} onPress={hideModal} />
        </Animated.View>
        
        <Animated.View style={[styles.modalContent, modalContentStyle]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modal Example</Text>
            <Pressable style={styles.modalCloseButton} onPress={hideModal}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              This modal demonstrates the premium modal animation system with
              emotional intelligence and performance optimization.
            </Text>
            
            <Text style={styles.modalText}>
              Current emotional state: {userState.primary}
            </Text>
            
            <Text style={styles.modalText}>
              Animation complexity adapted for device performance.
            </Text>
          </View>
          
          <View style={styles.modalFooter}>
            <Pressable style={styles.modalButton} onPress={hideModal}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderFAB = () => (
    <Animated.View style={[styles.fab, fabAnimatedStyle]}>
      <Pressable
        style={styles.fabPressable}
        onPress={() => {
          animateFAB('press');
          if (navigationState.currentScreen !== 'emergency') {
            navigateToScreen('emergency');
          } else {
            showModal();
          }
        }}
      >
        <Text style={styles.fabIcon}>
          {navigationState.currentScreen === 'emergency' ? '📞' : '🚨'}
        </Text>
      </Pressable>
    </Animated.View>
  );

  // ====================================
  // MAIN RENDER
  // ====================================

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.background}
      />

      {/* Screen content */}
      {renderScreen(currentScreen)}

      {/* Tab bar */}
      {renderTabBar()}

      {/* Floating action button */}
      {renderFAB()}

      {/* Modal */}
      {renderModal()}
    </SafeAreaView>
  );
};

// ====================================
// STYLES
// ====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },

  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  screenContent: {
    flex: 1,
    paddingTop: 20,
  },

  screenHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 24,
    marginBottom: 20,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  screenIcon: {
    fontSize: 40,
  },

  screenScrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },

  contentSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  sectionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textTransform: 'capitalize',
  },

  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  navigationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },

  navigationButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },

  navigationButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  controlsContainer: {
    gap: 8,
  },

  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },

  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 30,
    marginBottom: 8,
  },

  loadingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 8,
  },

  tabBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },

  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },

  tabIconActive: {
    fontSize: 20,
  },

  tabLabel: {
    fontSize: 10,
    color: 'rgba(102, 126, 234, 0.7)',
    fontWeight: '500',
  },

  tabLabelActive: {
    color: '#667eea',
    fontWeight: '700',
  },

  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  fabPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fabIcon: {
    fontSize: 24,
  },

  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalBackdropPressable: {
    width: '100%',
    height: '100%',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 24,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },

  modalCloseButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },

  modalBody: {
    padding: 20,
  },

  modalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },

  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },

  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnimatedNavigation;