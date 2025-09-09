import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate entrance
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      // Content slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Buttons fade in
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonsAnim, fadeAnim, logoScale, slideAnim]);

  const handleGetStarted = () => {
    navigation.navigate('Onboarding');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.content}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={[styles.logoContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Icon name="paw" size={80} color="white" />
            </View>
            
            <Text style={styles.appTitle}>TailTracker</Text>
            <Text style={styles.appSubtitle}>Your Pet's Digital Companion</Text>
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="shield-check" size={24} color="white" />
                <Text style={styles.featureText}>Secure pet profiles & medical records</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="bell-ring" size={24} color="white" />
                <Text style={styles.featureText}>Smart vaccination reminders</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="map-marker-alert" size={24} color="white" />
                <Text style={styles.featureText}>Lost pet alert network</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="account-group" size={24} color="white" />
                <Text style={styles.featureText}>Family sharing & emergency contacts</Text>
              </View>
            </View>
            
            <View style={styles.trustIndicators}>
              <View style={styles.trustItem}>
                <Icon name="lock" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.trustText}>Privacy Protected</Text>
              </View>
              <View style={styles.trustItem}>
                <Icon name="cloud-check" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.trustText}>Cloud Backup</Text>
              </View>
              <View style={styles.trustItem}>
                <Icon name="heart" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.trustText}>Pet Lovers</Text>
              </View>
            </View>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonSection,
              {
                opacity: buttonsAnim,
              },
            ]}
          >
            <Button
              mode="contained"
              onPress={handleGetStarted}
              style={[styles.primaryButton, { backgroundColor: 'white' }]}
              labelStyle={[styles.primaryButtonText, { color: theme.colors.primary }]}
              contentStyle={styles.buttonContent}
              icon="rocket-launch"
            >
              Get Started
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleLogin}
              style={[styles.secondaryButton, { borderColor: 'rgba(255, 255, 255, 0.5)' }]}
              labelStyle={styles.secondaryButtonText}
              contentStyle={styles.buttonContent}
              icon="login"
            >
              I Have an Account
            </Button>
            
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Decorative Elements */}
          <View style={styles.decorativeElements}>
            <Animated.View
              style={[
                styles.floatingPaw,
                styles.paw1,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '15deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="paw" size={20} color="rgba(255, 255, 255, 0.3)" />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.floatingPaw,
                styles.paw2,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-10deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="paw" size={16} color="rgba(255, 255, 255, 0.2)" />
            </Animated.View>
            
            <Animated.View
              style={[
                styles.floatingPaw,
                styles.paw3,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '20deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon name="paw" size={14} color="rgba(255, 255, 255, 0.25)" />
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  logoSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backdropFilter: 'blur(10px)',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  contentSection: {
    flex: 2,
    justifyContent: 'center',
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 16,
    fontWeight: '400',
    flex: 1,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonSection: {
    flex: 1.5,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingPaw: {
    position: 'absolute',
  },
  paw1: {
    top: '15%',
    right: '10%',
  },
  paw2: {
    top: '35%',
    left: '5%',
  },
  paw3: {
    bottom: '25%',
    right: '15%',
  },
});