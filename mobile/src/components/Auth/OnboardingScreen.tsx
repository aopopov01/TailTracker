import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Card,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Track Your Pets',
    description: 'Keep detailed profiles of all your pets with photos, medical records, and important information in one secure place.',
    icon: 'paw',
    color: '#6366f1'
  },
  {
    id: '2',
    title: 'Never Miss Vaccinations',
    description: 'Get smart reminders for vaccinations, vet appointments, and medication schedules to keep your pets healthy.',
    icon: 'medical-bag',
    color: '#10b981'
  },
  {
    id: '3',
    title: 'Lost Pet Alerts',
    description: 'If your pet goes missing, instantly alert nearby pet owners and create digital lost pet posters with QR codes.',
    icon: 'alert-circle',
    color: '#f59e0b'
  },
  {
    id: '4',
    title: 'Premium Features',
    description: 'Unlock advanced tracking, unlimited photo storage, and priority support with our premium subscription.',
    icon: 'crown',
    color: '#8b5cf6'
  }
];

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * width,
        animated: true,
      });
    } else {
      // Last slide - navigate to login
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      scrollViewRef.current?.scrollTo({
        x: prevSlide * width,
        animated: true,
      });
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={styles.slide}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${slide.color}20` }]}>
          <Icon name={slide.icon} size={80} color={slide.color} />
        </View>
        
        <Text style={[styles.slideTitle, { color: theme.colors.onBackground }]}>
          {slide.title}
        </Text>
        
        <Text style={[styles.slideDescription, { color: theme.colors.onSurfaceVariant }]}>
          {slide.description}
        </Text>
        
        {/* Feature highlights */}
        <View style={styles.featureContainer}>
          {index === 0 && (
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Digital pet passports
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Photo galleries
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Family sharing
                </Text>
              </View>
            </View>
          )}
          
          {index === 1 && (
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Smart reminders
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Vet appointments
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, { color: theme.colors.onSurfaceVariant }]}>
                  Medicine tracking
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
        >
          Skip
        </Button>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface }]}>
        {/* Page Indicators */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentSlide 
                    ? theme.colors.primary 
                    : theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlide > 0 && (
            <Button
              mode="outlined"
              onPress={handlePrevious}
              style={[styles.navButton, { borderColor: theme.colors.outline }]}
              icon="chevron-left"
            >
              Back
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={handleNext}
            style={[
              styles.navButton, 
              styles.nextButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon={currentSlide === slides.length - 1 ? "login" : "chevron-right"}
            contentStyle={{ flexDirection: currentSlide === slides.length - 1 ? 'row' : 'row-reverse' }}
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>
            TailTracker
          </Text>
          <Text style={[styles.appTagline, { color: theme.colors.onSurfaceVariant }]}>
            Your pet's digital companion
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    marginRight: -8,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureContainer: {
    width: '100%',
  },
  featureList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});